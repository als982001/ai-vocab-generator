// 브라우저 없이 서버 핸들러(api/analyze.js)를 직접 호출하는 테스트. 화면 fixture가 필요 없어 기본 test를 쓴다
// - 가짜 req/res로 호출하고, 상류 Gemini는 전역 fetch를 SSE 응답 stub으로 바꿔 흉내 낸다
// - api/analyze.js는 plain JS라 타입 선언이 없어 동적 import 후 시그니처를 직접 지정한다
import { expect, test } from "@playwright/test";
import { EventEmitter } from "node:events";

interface IFakeRequest {
  method: string;
  body?: unknown;
}

interface IHttpErrorBody {
  error: string;
  code: string;
}

type AnalyzeHandler = (
  request: IFakeRequest,
  response: FakeResponse
) => Promise<void>;

// api/analyze.js가 쓰는 Node ServerResponse 기능만 흉내 낸 응답
class FakeResponse extends EventEmitter {
  statusCode = 200;
  headers: Record<string, string> = {};
  chunks: string[] = [];
  jsonBody: unknown = undefined;
  writableEnded = false;
  writableFinished = false;
  isFlushed = false;

  setHeader(name: string, value: unknown) {
    this.headers[name.toLowerCase()] = String(value);
  }

  status(code: number) {
    this.statusCode = code;

    return this;
  }

  json(body: unknown) {
    this.jsonBody = body;
    this.end();

    return this;
  }

  writeHead(code: number, headers: Record<string, string>) {
    this.statusCode = code;

    Object.entries(headers).forEach(([name, value]) => {
      this.setHeader(name, value);
    });

    return this;
  }

  flushHeaders() {
    this.isFlushed = true;
  }

  write(chunk: string) {
    expect(this.writableEnded, "end 이후 write").toBe(false);

    this.chunks.push(chunk);

    return true;
  }

  end() {
    this.writableEnded = true;
    this.writableFinished = true;

    // Node처럼 정상 종료 뒤에도 close가 온다 (writableFinished라 abort하면 안 됨)
    setImmediate(() => {
      this.emit("close");
    });

    return this;
  }

  // 응답이 끝나기 전에 클라이언트가 연결을 끊은 상황
  disconnectClient() {
    this.emit("close");
  }

  getLines() {
    const lines = this.chunks
      .join("")
      .split("\n")
      .filter((line) => {
        return line.length > 0;
      })
      .map((line) => {
        return JSON.parse(line) as unknown;
      });

    return { lines };
  }

  getText() {
    return { text: `${this.chunks.join("")}${JSON.stringify(this.jsonBody)}` };
  }
}

const HANDLER_URL = new URL("../api/analyze.js", import.meta.url).href;

// 상류 오류 메시지 원문. 어떤 응답 본문에도 실리면 안 된다
const UPSTREAM_SECRET = "upstream-secret-detail";

const VALID_BODY = {
  imageBase64: "aGVsbG8=",
  mimeType: "image/png",
  language: "en",
};

const encoder = new TextEncoder();

/**
 * Gemini SSE 청크 한 개를 만든다.
 * @param text 모델 텍스트
 * @param finishReason 마지막 청크면 finishReason
 * @return event "data: ...\n\n" 형식 SSE 이벤트
 */
function buildSseEvent({
  text,
  finishReason,
}: {
  text: string;
  finishReason?: string;
}): { event: string } {
  const candidate = {
    content: { role: "model", parts: [{ text }] },
    index: 0,
    ...(finishReason ? { finishReason } : {}),
  };

  return { event: `data: ${JSON.stringify({ candidates: [candidate] })}\n\n` };
}

/**
 * SSE 이벤트들을 한 번에 돌려주는 200 응답을 만든다.
 * @param events SSE 이벤트 문자열
 * @return response text/event-stream 응답
 */
function buildSseResponse({ events }: { events: string[] }): {
  response: Response;
} {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      events.forEach((event) => {
        controller.enqueue(encoder.encode(event));
      });

      controller.close();
    },
  });

  return {
    response: new Response(body, {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    }),
  };
}

/**
 * 상류 HTTP 오류 응답을 만든다 (Gemini 오류 본문 형태).
 * @param status 상류 상태 코드
 * @param message 상류 오류 메시지
 * @return response JSON 오류 응답
 */
function buildUpstreamErrorResponse({
  status,
  message,
}: {
  status: number;
  message: string;
}): { response: Response } {
  return {
    response: new Response(
      JSON.stringify({ error: { code: status, message, status: "ERROR" } }),
      { status, headers: { "content-type": "application/json" } }
    ),
  };
}

interface IStubbedFetch {
  getLastSignal: () => { signal: AbortSignal | null };
}

/**
 * 전역 fetch를 Gemini 요청만 받는 stub으로 바꾼다 (afterEach에서 원복).
 * @param respond 요청 signal을 받아 응답을 만드는 함수
 * @return getLastSignal 마지막 요청에 쓰인 AbortSignal
 */
function stubFetch({
  respond,
}: {
  respond: ({ signal }: { signal: AbortSignal | null }) => Response;
}): IStubbedFetch {
  let lastSignal: AbortSignal | null = null;

  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);

    expect(url).toContain(":streamGenerateContent");

    lastSignal = init?.signal ?? null;

    return respond({ signal: lastSignal });
  };

  return {
    getLastSignal: () => {
      return { signal: lastSignal };
    },
  };
}

/**
 * 핸들러를 호출하고 끝날 때까지 기다린다.
 * @param body 요청 본문
 * @param method HTTP 메서드
 * @param whileRunning 핸들러가 도는 동안 응답 객체로 할 일 (연결 끊기 등)
 * @return response 핸들러가 채운 가짜 응답
 */
async function callHandler({
  body = VALID_BODY,
  method = "POST",
  whileRunning,
}: {
  body?: unknown;
  method?: string;
  whileRunning?: ({ response }: { response: FakeResponse }) => Promise<void>;
} = {}): Promise<{ response: FakeResponse }> {
  const { default: handler } = (await import(HANDLER_URL)) as {
    default: AnalyzeHandler;
  };

  const response = new FakeResponse();
  const handlerPromise = handler({ method, body }, response);

  if (whileRunning) await whileRunning({ response });

  await handlerPromise;

  return { response };
}

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.GEMINI_API_KEY;
const originalConsoleError = console.error;

test.beforeEach(() => {
  process.env.GEMINI_API_KEY = "e2e-dummy-gemini-key";

  // 핸들러의 console.error(error)가 테스트 출력을 덮지 않게 잠시 끈다
  console.error = () => {};
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;

  if (originalApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test("서버: 성공 → text 줄들 + done STOP, NDJSON 헤더", async () => {
  const { getLastSignal } = stubFetch({
    respond: () => {
      return buildSseResponse({
        events: [
          buildSseEvent({ text: '[{"word":' }).event,
          buildSseEvent({ text: '"apple"}]' }).event,
          buildSseEvent({ text: "", finishReason: "STOP" }).event,
        ],
      }).response;
    },
  });

  const { response } = await callHandler();

  expect(response.statusCode).toBe(200);
  expect(response.headers["content-type"]).toBe(
    "application/x-ndjson; charset=utf-8"
  );
  expect(response.headers["cache-control"]).toBe("no-cache, no-transform");
  expect(response.headers["x-accel-buffering"]).toBe("no");
  expect(response.isFlushed).toBe(true);
  expect(response.getLines().lines).toEqual([
    { type: "text", text: '[{"word":' },
    { type: "text", text: '"apple"}]' },
    { type: "done", finishReason: "STOP" },
  ]);
  expect(response.writableEnded).toBe(true);
  expect(getLastSignal().signal?.aborted).toBe(false);
});

const UPSTREAM_ERROR_CASES = [
  {
    name: "상류 400 + 파일 처리 불가",
    upstreamStatus: 400,
    message: `Unable to process input image. Please retry or report in https://developers.generativeai.google/guide/troubleshooting ${UPSTREAM_SECRET}`,
    status: 400,
    code: "UPSTREAM_BAD_REQUEST",
  },
  {
    name: "상류 400 일반 (요청·스키마 문제)",
    upstreamStatus: 400,
    message: `Request contains an invalid argument. ${UPSTREAM_SECRET}`,
    status: 502,
    code: "UPSTREAM_ERROR",
  },
  {
    name: "상류 400 + API 키 오류",
    upstreamStatus: 400,
    message: `API key not valid. Please pass a valid API key. API_KEY_INVALID ${UPSTREAM_SECRET}`,
    status: 500,
    code: "INTERNAL_ERROR",
  },
  {
    name: "상류 403",
    upstreamStatus: 403,
    message: `Permission denied. ${UPSTREAM_SECRET}`,
    status: 502,
    code: "UPSTREAM_ERROR",
  },
  {
    name: "상류 404",
    upstreamStatus: 404,
    message: `Model not found. ${UPSTREAM_SECRET}`,
    status: 502,
    code: "UPSTREAM_ERROR",
  },
  {
    name: "상류 422",
    upstreamStatus: 422,
    message: `Unprocessable. ${UPSTREAM_SECRET}`,
    status: 502,
    code: "UPSTREAM_ERROR",
  },
  {
    name: "상류 429",
    upstreamStatus: 429,
    message: `Resource exhausted. ${UPSTREAM_SECRET}`,
    status: 429,
    code: "RATE_LIMITED",
  },
  {
    name: "상류 500",
    upstreamStatus: 500,
    message: `Internal error. ${UPSTREAM_SECRET}`,
    status: 502,
    code: "UPSTREAM_ERROR",
  },
];

for (const {
  name,
  upstreamStatus,
  message,
  status,
  code,
} of UPSTREAM_ERROR_CASES) {
  test(`서버: ${name} → ${status} ${code}, 원문 메시지 노출 없음`, async () => {
    stubFetch({
      respond: () => {
        return buildUpstreamErrorResponse({ status: upstreamStatus, message })
          .response;
      },
    });

    const { response } = await callHandler();
    const body = response.jsonBody as IHttpErrorBody;

    expect(response.statusCode).toBe(status);
    expect(body.code).toBe(code);
    expect(typeof body.error).toBe("string");
    expect(response.chunks).toEqual([]);
    expect(response.getText().text).not.toContain(UPSTREAM_SECRET);
  });
}

test("서버: 스트림 도중 SSE 오류 청크 → 마지막 줄 STREAM_ERROR, 원문 노출 없음", async () => {
  const errorEvent = `data: ${JSON.stringify({
    error: { code: 500, status: "INTERNAL", message: UPSTREAM_SECRET },
  })}\n\n`;

  stubFetch({
    respond: () => {
      return buildSseResponse({
        events: [buildSseEvent({ text: "[{" }).event, errorEvent],
      }).response;
    },
  });

  const { response } = await callHandler();
  const { lines } = response.getLines();

  expect(response.statusCode).toBe(200);
  expect(lines.at(-1)).toEqual({ type: "error", code: "STREAM_ERROR" });
  expect(response.getText().text).not.toContain(UPSTREAM_SECRET);
  expect(response.writableEnded).toBe(true);
});

test("서버: SSE 오류 청크가 아닌 도중 실패(연결 끊김) → 마지막 줄 INCOMPLETE_STREAM", async () => {
  stubFetch({
    respond: () => {
      // 첫 청크 뒤 상류 연결이 끊긴 상황 (ApiError가 아닌 읽기 오류)
      // start에서 바로 error하면 쌓인 청크까지 버려지므로, 첫 청크를 읽힌 다음 pull에서 끊는다
      let pullCount = 0;

      const body = new ReadableStream<Uint8Array>(
        {
          pull(controller) {
            pullCount += 1;

            if (pullCount === 1) {
              controller.enqueue(
                encoder.encode(buildSseEvent({ text: "[{" }).event)
              );
              return;
            }

            controller.error(new TypeError(`terminated ${UPSTREAM_SECRET}`));
          },
        },
        { highWaterMark: 0 }
      );

      return new Response(body, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      });
    },
  });

  const { response } = await callHandler();

  expect(response.statusCode).toBe(200);
  expect(response.getLines().lines).toEqual([
    { type: "text", text: "[{" },
    { type: "error", code: "INCOMPLETE_STREAM" },
  ]);
  expect(response.getText().text).not.toContain(UPSTREAM_SECRET);
  expect(response.writableEnded).toBe(true);
});

test("서버: 응답 도중 클라이언트가 끊으면 상류 요청을 abort하고 STREAM_ERROR를 쓰지 않는다", async () => {
  let markFirstChunkSent = () => {};

  const firstChunkSent = new Promise<void>((resolve) => {
    markFirstChunkSent = resolve;
  });

  const { getLastSignal } = stubFetch({
    respond: ({ signal }) => {
      // 첫 청크만 보내고 열어 둔다. abort되면 실제 fetch처럼 본문 스트림이 오류로 끝난다
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            encoder.encode(buildSseEvent({ text: "[{" }).event)
          );
          markFirstChunkSent();

          signal?.addEventListener("abort", () => {
            controller.error(signal.reason);
          });
        },
      });

      return new Response(body, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      });
    },
  });

  const { response } = await callHandler({
    whileRunning: async ({ response: runningResponse }) => {
      await firstChunkSent;

      // 첫 줄이 클라이언트로 쓰인 뒤에 끊는다
      await expect
        .poll(() => {
          return runningResponse.chunks.length;
        })
        .toBe(1);

      runningResponse.disconnectClient();
    },
  });

  expect(getLastSignal().signal?.aborted).toBe(true);
  expect(response.getLines().lines).toEqual([{ type: "text", text: "[{" }]);
  expect(response.writableEnded).toBe(true);
});

test("서버: 405와 400 본문에 code가 붙는다", async () => {
  const { response: methodResponse } = await callHandler({ method: "GET" });

  expect(methodResponse.statusCode).toBe(405);
  expect(methodResponse.jsonBody).toEqual({
    error: "Method Not Allowed",
    code: "METHOD_NOT_ALLOWED",
  });

  const { response: invalidResponse } = await callHandler({
    body: { ...VALID_BODY, mimeType: "text/plain" },
  });

  expect(invalidResponse.statusCode).toBe(400);
  expect(invalidResponse.jsonBody).toEqual({
    error: "지원하지 않는 파일 형식입니다.",
    code: "INVALID_REQUEST",
  });
});
