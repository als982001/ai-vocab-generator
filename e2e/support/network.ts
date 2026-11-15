import type { BrowserContext, Request, Route } from "@playwright/test";

import { E2E_SUPABASE_URL } from "./env";

const APP_ORIGIN = "http://localhost:5173";
const GOOGLE_FONTS_HOST = "fonts.googleapis.com";
const GEMINI_HOST = "generativelanguage.googleapis.com";

export const E2E_ANALYSIS_ID = "e2e-analysis-1";

export interface IGate {
  promise: Promise<void>;
  release: () => void;
}

function createGate(): IGate {
  let release = () => {};

  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });

  return { promise, release };
}

/**
 * 요청이 Gemini streamGenerateContent(스트리밍 분석) 호출인지 판별한다.
 * @param request Playwright 요청 객체
 * @return isGemini Gemini 분석 요청 여부
 */
export function isGeminiRequest({ request }: { request: Request }): {
  isGemini: boolean;
} {
  const url = new URL(request.url());

  return {
    isGemini:
      url.hostname === GEMINI_HOST &&
      url.pathname.endsWith(":streamGenerateContent"),
  };
}

/**
 * Gemini streamGenerateContent 요청 본문에서 텍스트 part(프롬프트)만 이어 붙인다.
 * @param body postDataJSON()으로 파싱한 요청 본문
 * @return promptText 텍스트 part를 줄바꿈으로 이은 문자열 (없으면 빈 문자열)
 */
export function getGeminiPromptText({ body }: { body: unknown }): {
  promptText: string;
} {
  const contents = (body as { contents?: { parts?: { text?: unknown }[] }[] })
    ?.contents;

  const texts = (contents ?? [])
    .flatMap((content) => content.parts ?? [])
    .map((part) => part.text)
    .filter((text): text is string => typeof text === "string");

  return { promptText: texts.join("\n") };
}

/**
 * Gemini streamGenerateContent 요청 본문에서 generationConfig를 꺼낸다.
 * @param body postDataJSON()으로 파싱한 요청 본문
 * @return generationConfig 응답 형식 설정 (없으면 빈 객체)
 */
export function getGeminiGenerationConfig({ body }: { body: unknown }): {
  generationConfig: Record<string, unknown>;
} {
  const generationConfig = (
    body as { generationConfig?: Record<string, unknown> }
  )?.generationConfig;

  return { generationConfig: generationConfig ?? {} };
}

/**
 * 처리하지 않은 외부 요청을 모두 차단하고 기록한다.
 * 개별 mock보다 먼저 등록해야 한다 (나중에 등록한 route가 우선).
 * @param context 가드를 걸 브라우저 컨텍스트
 * @return blockedUrls 차단된 URL 목록 (teardown에서 비어 있어야 함)
 */
export async function installLeakGuard({
  context,
}: {
  context: BrowserContext;
}) {
  const blockedUrls: string[] = [];

  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());

    if (url.origin === APP_ORIGIN) {
      await route.continue();
      return;
    }

    // app.css의 @import 폰트. 폰트만 빠지고 동작에는 영향 없다
    if (url.hostname === GOOGLE_FONTS_HOST) {
      await route.fulfill({ status: 200, contentType: "text/css", body: "" });
      return;
    }

    blockedUrls.push(`${route.request().method()} ${url.href}`);
    await route.abort("blockedbyclient");
  });

  return { blockedUrls };
}

// success: 단어 응답(SSE), error: HTTP 500, network: 연결 끊김, streamError: 일부 텍스트 후 SSE 오류 청크
export type GeminiResponseMode =
  | "success"
  | "error"
  | "network"
  | "streamError";

export interface IGeminiMockResponse {
  mode: GeminiResponseMode;
  words?: unknown; // 모델이 돌려줄 단어 배열 (JSON 문자열로 감싸 응답)
  responseText?: string | null; // 모델 텍스트 원문 (있으면 words보다 우선)
  texts?: string[]; // 청크별 텍스트를 직접 지정 (있으면 responseText·words보다 우선)
  finishReason?: string | null; // 마지막 청크의 finishReason (기본 "STOP", null이면 생략)
}

// 성공 응답을 몇 조각의 SSE 이벤트로 나눌지 (청크 경계 처리를 기본으로 태운다)
const DEFAULT_SSE_CHUNK_COUNT = 3;

/**
 * 텍스트를 거의 같은 길이의 조각으로 나눈다 (코드 포인트 단위라 서로게이트 쌍을 가르지 않음).
 * @param text 나눌 텍스트
 * @param count 조각 수 (빈 텍스트도 count개의 빈 조각)
 * @return texts 나눈 조각 목록
 */
export function splitText({ text, count }: { text: string; count: number }): {
  texts: string[];
} {
  const chars = Array.from(text);
  const size = Math.ceil(chars.length / count);

  const texts = Array.from({ length: count }, (_, index) => {
    return chars.slice(index * size, (index + 1) * size).join("");
  });

  return { texts };
}

/**
 * Gemini streamGenerateContent(alt=sse) 응답 본문을 만든다.
 * SDK는 이벤트를 빈 줄로 구분하고, 끝에 남은 조각이 있으면 실패하므로 이벤트마다 "\n\n"으로 끝낸다.
 * @param texts 청크마다 모델이 돌려줄 텍스트
 * @param finishReason 마지막 청크에 붙일 finishReason (null이면 생략 = 잘린 스트림 재현)
 * @return body text/event-stream 응답 본문
 */
export function buildGeminiSseBody({
  texts,
  finishReason,
}: {
  texts: string[];
  finishReason: string | null;
}): { body: string } {
  const body = texts
    .map((text, index) => {
      const isLast = index === texts.length - 1;

      const chunk = {
        candidates: [
          {
            content: { role: "model", parts: [{ text }] },
            index: 0,
            ...(isLast && finishReason ? { finishReason } : {}),
          },
        ],
      };

      return `data: ${JSON.stringify(chunk)}\n\n`;
    })
    .join("");

  return { body };
}

/**
 * 응답 설정에 맞는 청크별 텍스트를 정한다.
 * @param response 요청에 대응하는 mock 응답 설정
 * @return texts 청크별 텍스트
 */
function resolveResponseTexts({
  response,
}: {
  response: IGeminiMockResponse;
}): {
  texts: string[];
} {
  if (response.texts) return { texts: response.texts };

  return splitText({
    text: response.responseText ?? JSON.stringify(response.words ?? []),
    count: DEFAULT_SSE_CHUNK_COUNT,
  });
}

/**
 * 붙잡았던 Gemini 요청을 응답 설정대로 끝낸다.
 * @param route 가로챈 route
 * @param response 요청에 대응하는 mock 응답 설정
 */
async function fulfillGeminiRoute({
  route,
  response,
}: {
  route: Route;
  response: IGeminiMockResponse;
}) {
  // @google/genai는 httpOptions.retryOptions를 주지 않으면 재시도하지 않아
  // 500 한 번이면 바로 실패 분기로 간다
  if (response.mode === "error") {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: 500,
          message: "Internal error encountered.",
          status: "INTERNAL",
        },
      }),
    });
    return;
  }

  // fetch 자체가 실패 (브라우저에선 TypeError)
  if (response.mode === "network") {
    await route.abort("internetdisconnected");
    return;
  }

  const { texts } = resolveResponseTexts({ response });

  if (response.mode === "streamError") {
    // 텍스트 일부를 보낸 뒤 SSE 오류 청크. SDK가 ApiError로 던진다
    const { body: textBody } = buildGeminiSseBody({
      texts: texts.slice(0, 1),
      finishReason: null,
    });
    const errorChunk = JSON.stringify({
      error: { code: 500, status: "INTERNAL", message: "Stream failed." },
    });

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: `${textBody}data: ${errorChunk}\n\n`,
    });
    return;
  }

  const finishReason =
    response.finishReason === undefined ? "STOP" : response.finishReason;
  const { body } = buildGeminiSseBody({ texts, finishReason });

  await route.fulfill({ status: 200, contentType: "text/event-stream", body });
}

/**
 * Gemini 호출을 mock한다. 요청마다 자기 gate가 풀릴 때까지 응답을 붙잡는다.
 * - i번째 요청은 responses[i]로 응답 (응답 수보다 요청이 많으면 마지막 응답을 반복)
 * - gate는 요청 index마다 따로 (요청 전에 미리 꺼내 둘 수도 있음)
 * - 페이지가 취소(abort)한 요청은 abortedGeminiRequests에 index로 기록하고,
 *   그 요청에 대한 늦은 fulfill/abort 실패는 삼킨다
 * @param context mock을 걸 브라우저 컨텍스트
 * @param responses 요청 순서대로의 응답 설정 (최소 1개)
 * @return getGate index번째 요청의 gate, releaseAll 모든 gate 해제(이후 요청은 바로 응답),
 *   getRequestCount 들어온 요청 수, getSettledCount 응답 처리를 마친(또는 취소로 건너뛴) 요청 수,
 *   abortedGeminiRequests 페이지가 취소한 요청 index 목록
 */
export async function mockGemini({
  context,
  responses,
}: {
  context: BrowserContext;
  responses: IGeminiMockResponse[];
}) {
  const gates: IGate[] = [];
  const requestIndexes = new Map<Request, number>();
  const abortedGeminiRequests: number[] = [];

  let isAllReleased = false;
  let requestCount = 0;
  let settledCount = 0;

  const getGate = ({ index }: { index: number }) => {
    while (gates.length <= index) {
      const gate = createGate();

      if (isAllReleased) gate.release();

      gates.push(gate);
    }

    return { gate: gates[index] };
  };

  const releaseAll = () => {
    isAllReleased = true;

    gates.forEach((gate) => {
      gate.release();
    });
  };

  const getRequestCount = () => {
    return { count: requestCount };
  };

  const getSettledCount = () => {
    return { count: settledCount };
  };

  // 페이지 쪽 취소(AbortController)는 Chromium에서 net::ERR_ABORTED로 실패한다
  context.on("requestfailed", (request) => {
    const index = requestIndexes.get(request);

    if (index === undefined) return;

    if (request.failure()?.errorText.includes("ABORTED")) {
      abortedGeminiRequests.push(index);
    }
  });

  await context.route(
    (url) => url.hostname === GEMINI_HOST,
    async (route) => {
      const request = route.request();
      const index = requestCount;

      requestCount += 1;
      requestIndexes.set(request, index);

      const response = responses[Math.min(index, responses.length - 1)];
      const { gate } = getGate({ index });

      await gate.promise;

      try {
        await fulfillGeminiRoute({ route, response });
      } catch (error) {
        // 이미 취소된 요청에 응답하려다 난 실패만 삼킨다
        if (!abortedGeminiRequests.includes(index) && !request.failure()) {
          throw error;
        }
      } finally {
        settledCount += 1;
      }
    }
  );

  return {
    getGate,
    releaseAll,
    getRequestCount,
    getSettledCount,
    abortedGeminiRequests,
  };
}

/**
 * Supabase REST 저장 요청을 mock하고 POST 본문을 기록한다.
 * @param context mock을 걸 브라우저 컨텍스트
 * @return analysesPosts, wordsPosts 기록된 요청 본문
 */
export async function mockSupabase({ context }: { context: BrowserContext }) {
  const analysesPosts: Record<string, unknown>[] = [];
  const wordsPosts: Record<string, unknown>[][] = [];

  await context.route(
    `${E2E_SUPABASE_URL}/rest/v1/analyses*`,
    async (route) => {
      const request = route.request();

      if (request.method() !== "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        });
        return;
      }

      const body = request.postDataJSON() as Record<string, unknown>;

      analysesPosts.push(body);

      // .select().single() 응답 형태: 단일 객체
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: E2E_ANALYSIS_ID,
          created_at: "2026-11-14T00:00:00.000Z",
          ...body,
        }),
      });
    }
  );

  await context.route(`${E2E_SUPABASE_URL}/rest/v1/words*`, async (route) => {
    const request = route.request();

    if (request.method() !== "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
      return;
    }

    wordsPosts.push(request.postDataJSON() as Record<string, unknown>[]);

    await route.fulfill({ status: 201, body: "" });
  });

  return { analysesPosts, wordsPosts };
}
