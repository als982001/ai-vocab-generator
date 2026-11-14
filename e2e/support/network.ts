import type { BrowserContext, Request } from "@playwright/test";

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
 * 요청이 Gemini generateContent 호출인지 판별한다.
 * @param request Playwright 요청 객체
 * @return isGemini Gemini 분석 요청 여부
 */
export function isGeminiRequest({ request }: { request: Request }): {
  isGemini: boolean;
} {
  const url = new URL(request.url());

  return {
    isGemini:
      url.hostname === GEMINI_HOST && url.pathname.endsWith(":generateContent"),
  };
}

/**
 * 처리하지 않은 외부 요청을 모두 차단하고 기록한다.
 * 개별 mock보다 먼저 등록해야 한다 (나중에 등록한 route가 우선).
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

/**
 * Gemini generateContent 호출을 mock한다. gate가 풀릴 때까지 응답을 붙잡는다.
 * @param words 모델이 돌려줄 단어 배열 (JSON 문자열로 감싸 응답)
 */
export async function mockGemini({
  context,
  words,
}: {
  context: BrowserContext;
  words: unknown;
}) {
  const gate = createGate();

  await context.route(
    (url) => url.hostname === GEMINI_HOST,
    async (route) => {
      await gate.promise;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          candidates: [
            {
              content: {
                role: "model",
                parts: [{ text: JSON.stringify(words) }],
              },
              finishReason: "STOP",
              index: 0,
            },
          ],
        }),
      });
    }
  );

  return { gate };
}

/**
 * Supabase REST 저장 요청을 mock하고 POST 본문을 기록한다.
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
