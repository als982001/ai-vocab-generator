import type { Page, Request } from "@playwright/test";
import { readFileSync } from "node:fs";

import { type IGeminiMockResponse, isGeminiRequest } from "./support/network";
import {
  ENGLISH_SAMPLE_PATH,
  ENGLISH_WORDS,
  expect,
  test,
} from "./support/test";

const SUCCESS_TOAST = "분석을 성공했습니다.";
const INCOMPLETE_TOAST =
  "분석 결과를 끝까지 받지 못했습니다. 다시 시도해주세요.";
const NETWORK_TOAST = "네트워크 연결을 확인한 뒤 다시 시도해주세요.";
const SERVER_TOAST = "파일 분석에 실패했습니다. 다시 시도해주세요.";
const LOCK_HINT = "파일을 제거하면 언어를 변경할 수 있어요";

const WORD_CARD_SELECTOR = '[id^="word-card-"]';
const TOAST_SELECTOR = "[data-sonner-toast]";

// 문자열 안 따옴표·괄호·역슬래시, \u 이스케이프를 모두 태우는 응답
const STREAM_WORDS = [
  {
    word: "café",
    reading: "/kæˈfeɪ/",
    meaning: '카페 "작은 식당" {중괄호} [대괄호]',
    level: "A2",
    part_of_speech: "noun",
    box_2d: [10, 20, 30, 40],
  },
  {
    word: "quote",
    reading: "/kwoʊt/",
    meaning: "인용 \\ 역슬래시",
    level: "B1",
    part_of_speech: "noun",
    box_2d: [50, 60, 70, 80],
  },
];

// word의 é만 é 이스케이프로 바꿔, 이스케이프 중간에서 청크를 가를 수 있게 한다
const STREAM_TEXT = JSON.stringify(STREAM_WORDS).replace("é", "\\u00e9");

/**
 * 텍스트를 지정한 위치들에서 잘라 청크 목록을 만든다.
 * @param text 자를 텍스트
 * @param cutIndexes 자를 위치 (UTF-16 index)
 * @return texts 잘린 청크 목록
 */
function cutText({
  text,
  cutIndexes,
}: {
  text: string;
  cutIndexes: number[];
}): {
  texts: string[];
} {
  const points = [
    0,
    ...[...new Set(cutIndexes)].sort((a, b) => {
      return a - b;
    }),
    text.length,
  ];

  const texts = points.slice(0, -1).map((start, index) => {
    return text.slice(start, points[index + 1]);
  });

  return { texts };
}

const STREAM_CHUNKS = cutText({
  text: STREAM_TEXT,
  cutIndexes: [
    STREAM_TEXT.indexOf("작은") + 1, // 문자열 중간
    STREAM_TEXT.indexOf('\\"') + 1, // \ 와 " 사이
    STREAM_TEXT.indexOf("\\u00e9") + 3, // \u0 | 0e9
    STREAM_TEXT.indexOf("{중괄호") + 1, // 문자열 안 { 직후
    STREAM_TEXT.indexOf("},{") + 1, // 원소 경계
  ],
}).texts;

const A_WORDS = [
  {
    word: "alpha",
    reading: "/ˈæl.fə/",
    meaning: "첫 번째",
    level: "B2",
    part_of_speech: "noun",
    box_2d: [10, 10, 20, 20],
  },
];

const B_WORDS = [
  {
    word: "bravo",
    reading: "/ˈbrɑː.voʊ/",
    meaning: "잘했어",
    level: "B1",
    part_of_speech: "interjection",
    box_2d: [30, 30, 40, 40],
  },
];

/**
 * 영어를 선택하고 드롭존 input으로 샘플 이미지를 올린 뒤 Gemini 요청이 나갈 때까지 기다린다.
 * @param page Playwright 페이지
 * @return request 붙잡힌 Gemini 요청
 */
async function uploadEnglishSample({
  page,
}: {
  page: Page;
}): Promise<{ request: Request }> {
  await page.goto("/");

  await page.getByRole("combobox", { name: "추출 언어" }).selectOption("en");

  const requestPromise = page.waitForRequest((request) => {
    return isGeminiRequest({ request }).isGemini;
  });

  await page
    .locator('input[type="file"][aria-label="파일 업로드"]')
    .setInputFiles(ENGLISH_SAMPLE_PATH);

  const request = await requestPromise;

  return { request };
}

// 배열 값은 Playwright가 [값, 옵션] 튜플로 해석하므로 반드시 튜플로 감싼다.
// 타입이 있는 배열 옵션은 test.use 타입이 { option: true }를 받지 않아 { scope: "test" }로 감싼다
// (런타임은 두 번째 원소가 객체면 튜플로 본다)
test.describe("여러 청크 성공", () => {
  test.use({
    geminiResponses: [
      [{ mode: "success", texts: STREAM_CHUNKS }],
      { scope: "test" },
    ],
  });

  test("청크 경계가 문자열·이스케이프 중간이어도 모든 단어를 보여주고 한 번만 저장한다", async ({
    page,
    mocks,
  }) => {
    const { geminiGate, analysesPosts, wordsPosts } = mocks;

    // 경계 케이스를 실제로 갈랐는지 (indexOf 실패로 -1이 되면 청크가 줄어든다)
    expect(STREAM_CHUNKS.length).toBe(6);
    expect(STREAM_CHUNKS.join("")).toBe(STREAM_TEXT);

    await uploadEnglishSample({ page });

    geminiGate.release();

    for (const { word, meaning } of STREAM_WORDS) {
      const card = page.locator(`[id="word-card-${word}"]`);

      await expect(card).toContainText(word);
      await expect(card).toContainText(meaning);
    }

    await expect(page.getByText(SUCCESS_TOAST)).toHaveCount(1);

    await expect.poll(() => wordsPosts.length).toBe(1);

    expect(wordsPosts[0].map((row) => row.word)).toEqual(["café", "quote"]);
    expect(analysesPosts).toHaveLength(1);

    // 즉시 평가되는 부정 단언이라 맨 끝에 둔다 (중복 저장 회귀 감지)
    expect(wordsPosts).toHaveLength(1);
  });
});

const VALID_TEXT = JSON.stringify(A_WORDS);

const INCOMPLETE_CASES: { name: string; response: IGeminiMockResponse }[] = [
  {
    name: "finishReason 없이 끝남 (JSON은 완성)",
    response: { mode: "success", responseText: VALID_TEXT, finishReason: null },
  },
  {
    name: "MAX_TOKENS로 끝남 (JSON은 완성)",
    response: {
      mode: "success",
      responseText: VALID_TEXT,
      finishReason: "MAX_TOKENS",
    },
  },
  {
    name: "finishReason 없이 끝남 (JSON 잘림)",
    response: {
      mode: "success",
      responseText: VALID_TEXT.slice(0, -10),
      finishReason: null,
    },
  },
];

for (const { name, response } of INCOMPLETE_CASES) {
  test.describe(`끝까지 받지 못함: ${name}`, () => {
    test.use({ geminiResponses: [[response], { scope: "test" }] });

    test(`${name} → incomplete 안내 · 결과 없음 · 저장 안 함 · 잠금 유지`, async ({
      page,
      mocks,
    }) => {
      const { geminiGate, analysesPosts, wordsPosts } = mocks;

      await uploadEnglishSample({ page });

      geminiGate.release();

      await expect(page.getByText(INCOMPLETE_TOAST)).toBeVisible();
      await expect(page.getByText(SUCCESS_TOAST)).toBeHidden();
      await expect(page.locator(WORD_CARD_SELECTOR)).toHaveCount(0);

      // 실패해도 파일이 남아 있어 언어 잠금 유지
      await expect(
        page.getByRole("combobox", { name: "추출 언어" })
      ).toBeDisabled();
      await expect(page.getByText(LOCK_HINT)).toBeVisible();

      // 즉시 평가되는 부정 단언이라 맨 끝에 둔다
      expect(analysesPosts).toHaveLength(0);
      expect(wordsPosts).toHaveLength(0);
    });
  });
}

// 취소 계층 검증: 이전 요청이 AbortController로 실제 취소되는지 (network route 기반).
// 취소가 새는 경우의 마지막 방어선(requestId 가드)은 아래 "stale 가드" 테스트가 따로 검증한다
test.describe("분석 중 다른 파일로 교체 (취소 계층)", () => {
  test.use({
    geminiResponses: [
      [
        { mode: "success", words: A_WORDS },
        { mode: "success", words: B_WORDS },
      ],
      { scope: "test" },
    ],
  });

  test("이전 요청은 abort되고, 늦게 풀린 이전 응답은 화면·토스트·저장에 반영되지 않는다", async ({
    page,
    mocks,
  }) => {
    const {
      geminiGateAt,
      getGeminiSettledCount,
      abortedGeminiRequests,
      analysesPosts,
      wordsPosts,
    } = mocks;

    // 1. A 업로드 → 요청 0 붙잡힘
    await uploadEnglishSample({ page });

    // 2. 분석 중 FAB의 숨은 input으로 B 업로드 → 요청 1
    const secondRequestPromise = page.waitForRequest((request) => {
      return isGeminiRequest({ request }).isGemini;
    });

    await page.locator('input[aria-label="새 파일 업로드"]').setInputFiles({
      name: "b.png",
      mimeType: "image/png",
      buffer: readFileSync(ENGLISH_SAMPLE_PATH),
    });

    await secondRequestPromise;

    // 3. B 응답 먼저 → B 결과, 성공 안내 1번, 저장 1번
    geminiGateAt({ index: 1 }).gate.release();

    await expect(page.locator('[id="word-card-bravo"]')).toBeVisible();
    await expect(page.getByText(SUCCESS_TOAST)).toHaveCount(1);
    await expect.poll(() => wordsPosts.length).toBe(1);

    expect(analysesPosts).toHaveLength(1);
    expect(analysesPosts[0].image_name).toBe("b.png");

    // 4. 페이지가 A 요청을 실제로 취소했는지 먼저 확정한다.
    // 취소가 안 됐는데 아래 부정 단언이 통과하는(헛통과) 경우를 막는다
    await expect.poll(() => abortedGeminiRequests).toContain(0);

    // 5. 늦게 A 응답 → 이미 취소된 요청이라 아무 변화 없음
    geminiGateAt({ index: 0 }).gate.release();

    await expect.poll(() => getGeminiSettledCount().count).toBe(2);

    await expect(page.locator('[id="word-card-alpha"]')).toHaveCount(0);
    await expect(page.locator('[id="word-card-bravo"]')).toBeVisible();
    await expect(page.getByText(SUCCESS_TOAST)).toHaveCount(1);

    // 즉시 평가되는 부정 단언이라 맨 끝에 둔다
    expect(analysesPosts).toHaveLength(1);
    expect(wordsPosts).toHaveLength(1);
  });
});

test("분석 중 파일 제거 → 요청 취소 · 잠금 해제 · 늦은 응답은 무시", async ({
  page,
  mocks,
}) => {
  const {
    geminiGate,
    getGeminiSettledCount,
    abortedGeminiRequests,
    analysesPosts,
    wordsPosts,
  } = mocks;

  const languageSelect = page.getByRole("combobox", { name: "추출 언어" });

  await uploadEnglishSample({ page });

  await expect(languageSelect).toBeDisabled();

  // 분석 중에도 제거 버튼이 보여야 한다 (취소 수단)
  await page.getByRole("button", { name: "파일 제거" }).click();

  await expect(languageSelect).toBeEnabled();
  await expect(page.getByText(LOCK_HINT)).toBeHidden();
  await expect(page.getByText("아직 분석된 단어가 없습니다")).toBeVisible();

  // 페이지가 요청을 실제로 취소했는지 먼저 확정한다 (헛통과 방지)
  await expect.poll(() => abortedGeminiRequests).toContain(0);

  // 응답을 풀어도 취소된 요청이라 화면에 반영되지 않는다
  geminiGate.release();

  await expect.poll(() => getGeminiSettledCount().count).toBe(1);

  await expect(page.locator(TOAST_SELECTOR)).toHaveCount(0);
  await expect(page.locator(WORD_CARD_SELECTOR)).toHaveCount(0);

  // 즉시 평가되는 부정 단언이라 맨 끝에 둔다
  expect(analysesPosts).toHaveLength(0);
  expect(wordsPosts).toHaveLength(0);
});

const FAILURE_CASES = [
  { mode: "network", toast: NETWORK_TOAST, name: "연결 끊김" },
  { mode: "streamError", toast: SERVER_TOAST, name: "스트림 도중 오류" },
] as const;

for (const { mode, toast, name } of FAILURE_CASES) {
  test.describe(`실패: ${name}`, () => {
    test.use({ geminiResponse: mode });

    test(`${name} → 원인에 맞는 안내 · 결과 없음 · 저장 안 함`, async ({
      page,
      mocks,
    }) => {
      const { geminiGate, analysesPosts, wordsPosts } = mocks;

      await uploadEnglishSample({ page });

      geminiGate.release();

      await expect(page.getByText(toast)).toBeVisible();
      await expect(page.getByText(SUCCESS_TOAST)).toBeHidden();
      await expect(page.locator(WORD_CARD_SELECTOR)).toHaveCount(0);

      // 즉시 평가되는 부정 단언이라 맨 끝에 둔다
      expect(analysesPosts).toHaveLength(0);
      expect(wordsPosts).toHaveLength(0);
    });
  });
}

// 지연 스트림 stub이 마지막 청크를 붙잡아 두는 동안 테스트가 호출할 전역 함수 이름
const RELEASE_FINAL_CHUNK_KEY = "__e2eReleaseGeminiFinalChunk";

// 청크 사이 간격. 첫 카드로 목록이 마운트된 뒤 다음 카드가 "늦게" 붙도록 충분히 띄운다
const CHUNK_INTERVAL_MS = 300;

/**
 * 페이지의 window.fetch를 바꿔 Gemini streamGenerateContent 요청에 시간차 SSE 스트림으로 응답한다.
 * route.fulfill은 본문을 한 번에 보내 스트리밍 중 화면을 재현할 수 없어서 쓴다.
 * - 마지막 청크 전까지는 간격을 두고 보내고, 마지막 청크(finishReason STOP)는
 *   window[RELEASE_FINAL_CHUNK_KEY]()가 호출될 때까지 붙잡는다
 * - 네트워크로 나가지 않으므로 누수 가드·Gemini route를 거치지 않는다
 * - page.addInitScript라 이 테스트의 페이지에만 적용된다
 * @param page Playwright 페이지
 * @param texts 청크별 모델 텍스트
 */
async function stubDelayedGeminiStream({
  page,
  texts,
}: {
  page: Page;
  texts: string[];
}) {
  await page.addInitScript(
    ({ texts, releaseKey, intervalMs }) => {
      const originalFetch = window.fetch.bind(window);
      const encoder = new TextEncoder();

      let releaseFinalChunk = () => {};

      const finalChunkGate = new Promise<void>((resolve) => {
        releaseFinalChunk = resolve;
      });

      (window as unknown as Record<string, () => void>)[releaseKey] =
        releaseFinalChunk;

      const wait = (ms: number) => {
        return new Promise<void>((resolve) => {
          setTimeout(resolve, ms);
        });
      };

      const toSseEvent = (text: string, isLast: boolean) => {
        const candidate = {
          content: { role: "model", parts: [{ text }] },
          index: 0,
          ...(isLast ? { finishReason: "STOP" } : {}),
        };

        return encoder.encode(
          `data: ${JSON.stringify({ candidates: [candidate] })}\n\n`
        );
      };

      window.fetch = async (input, init) => {
        const url =
          input instanceof Request
            ? input.url
            : new URL(String(input), window.location.href).toString();

        if (!url.includes(":streamGenerateContent")) {
          return originalFetch(input, init);
        }

        const body = new ReadableStream<Uint8Array>({
          async start(controller) {
            for (const [index, text] of texts.entries()) {
              const isLast = index === texts.length - 1;

              if (isLast) {
                await finalChunkGate;
              } else {
                await wait(intervalMs);
              }

              controller.enqueue(toSseEvent(text, isLast));
            }

            controller.close();
          },
        });

        return new Response(body, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      };
    },
    {
      texts,
      releaseKey: RELEASE_FINAL_CHUNK_KEY,
      intervalMs: CHUNK_INTERVAL_MS,
    }
  );
}

// 단어 하나당 청크 하나: "[{...}" / ",{...}" / ",{...}]"
const DELAYED_CHUNKS = ENGLISH_WORDS.map((word, index) => {
  const prefix = index === 0 ? "[" : ",";
  const suffix = index === ENGLISH_WORDS.length - 1 ? "]" : "";

  return `${prefix}${JSON.stringify(word)}${suffix}`;
});

test("시간차 스트림: 늦게 추가된 카드도 끝까지 보이고, 스트리밍 중엔 수신 표시·다운로드 잠금", async ({
  page,
  mocks,
}) => {
  const { getGeminiRequestCount, analysesPosts, wordsPosts } = mocks;

  await stubDelayedGeminiStream({ page, texts: DELAYED_CHUNKS });

  await page.goto("/");

  await page.getByRole("combobox", { name: "추출 언어" }).selectOption("en");

  await page
    .locator('input[type="file"][aria-label="파일 업로드"]')
    .setInputFiles(ENGLISH_SAMPLE_PATH);

  const cardLocators = ENGLISH_WORDS.map(({ word }) => {
    return page.locator(`[id="word-card-${word}"]`);
  });

  // 카드 래퍼(AnimatedListItem)의 opacity. 등장 애니메이션이 멈추면 0에 남는다
  const getItemOpacity = async ({ index }: { index: number }) => {
    const opacity = await cardLocators[index].evaluate((element) => {
      return Number(getComputedStyle(element.parentElement ?? element).opacity);
    });

    return { opacity };
  };

  // 카드부터 결과 패널(aside)까지 조상 opacity를 곱한 실제 보이는 정도
  const getEffectiveOpacity = async ({ index }: { index: number }) => {
    const opacity = await cardLocators[index].evaluate((element) => {
      let current: Element | null = element;
      let product = 1;

      while (current && current.tagName !== "ASIDE") {
        product *= Number(getComputedStyle(current).opacity);
        current = current.parentElement;
      }

      return product;
    });

    return { opacity };
  };

  // 1. 마지막 청크를 붙잡은 상태: 앞의 두 카드만 잠정 표시
  await expect(cardLocators[1]).toBeAttached();

  await expect(page.getByText("단어 수신 중… 2개")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Download \d+ words$/ })
  ).toBeDisabled();
  await expect(cardLocators[2]).toHaveCount(0);

  // 첫 카드 뒤에 늦게 붙은 두 번째 카드도 등장 애니메이션을 끝내야 한다
  for (const index of [0, 1]) {
    await expect
      .poll(async () => {
        return (await getItemOpacity({ index })).opacity;
      })
      .toBe(1);
  }

  // 2. 마지막 청크 해제 → 최종 결과
  await page.evaluate((releaseKey) => {
    (window as unknown as Record<string, () => void>)[releaseKey]();
  }, RELEASE_FINAL_CHUNK_KEY);

  await expect(page.getByText(SUCCESS_TOAST)).toBeVisible();
  await expect(
    page.getByText(`Found ${ENGLISH_WORDS.length} items from last scan`)
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Download \d+ words$/ })
  ).toBeEnabled();

  // 모든 최종 카드가 완전히 보여야 한다 (스트리밍용 opacity-80도 풀림)
  for (const index of cardLocators.keys()) {
    await expect
      .poll(async () => {
        return (await getEffectiveOpacity({ index })).opacity;
      })
      .toBe(1);
  }

  await expect.poll(() => wordsPosts.length).toBe(1);

  expect(analysesPosts).toHaveLength(1);

  // stub이 응답했으므로 Gemini route(네트워크)까지 간 요청은 없어야 한다
  expect(getGeminiRequestCount().count).toBe(0);

  // 즉시 평가되는 부정 단언이라 맨 끝에 둔다 (중복 저장 회귀 감지)
  expect(wordsPosts).toHaveLength(1);
});

// stale 가드 stub이 쓰는 전역 이름 (요청 수, index별 스트림 해제 함수)
const STALE_STUB_KEY = "__e2eStaleGeminiStub";

interface IStaleStubState {
  requestCount: number;
  readToEndIndexes: number[];
  release: (index: number) => void;
}

/**
 * window.fetch를 바꿔 Gemini streamGenerateContent 요청마다 붙잡아 둔 스트림으로 응답한다.
 * AbortSignal을 일부러 무시해서, 취소가 새더라도 hook의 requestId 가드만으로 stale 응답을 막는지 확인한다.
 * - i번째 요청은 responseTexts[i]를 SSE 한 청크(finishReason STOP)로, release(i) 전까지 붙잡는다
 * - highWaterMark 0이라 소비자가 읽을 때만 pull된다. 끝(close)까지 pull되면 readToEndIndexes에 기록
 * - 네트워크로 나가지 않으므로 누수 가드·Gemini route를 거치지 않는다 (이 테스트의 페이지에만 적용)
 * @param page Playwright 페이지
 * @param responseTexts 요청 순서대로의 모델 텍스트
 */
async function stubSignalIgnoringGeminiStream({
  page,
  responseTexts,
}: {
  page: Page;
  responseTexts: string[];
}) {
  await page.addInitScript(
    ({ responseTexts, stubKey }) => {
      const originalFetch = window.fetch.bind(window);
      const encoder = new TextEncoder();
      const releasers: (() => void)[] = [];
      const gates: Promise<void>[] = responseTexts.map((_, index) => {
        return new Promise<void>((resolve) => {
          releasers[index] = resolve;
        });
      });

      const state: IStaleStubState = {
        requestCount: 0,
        readToEndIndexes: [],
        release: (index) => {
          releasers[index]?.();
        },
      };

      (window as unknown as Record<string, IStaleStubState>)[stubKey] = state;

      window.fetch = async (input, init) => {
        const url =
          input instanceof Request
            ? input.url
            : new URL(String(input), window.location.href).toString();

        if (!url.includes(":streamGenerateContent")) {
          return originalFetch(input, init);
        }

        // init.signal은 일부러 보지 않는다 (취소가 전달되지 않는 상황 재현)
        const index = Math.min(state.requestCount, responseTexts.length - 1);

        state.requestCount += 1;

        const candidate = {
          content: { role: "model", parts: [{ text: responseTexts[index] }] },
          index: 0,
          finishReason: "STOP",
        };
        const chunks = [
          encoder.encode(
            `data: ${JSON.stringify({ candidates: [candidate] })}\n\n`
          ),
        ];

        const body = new ReadableStream<Uint8Array>(
          {
            async pull(controller) {
              await gates[index];

              const nextChunk = chunks.shift();

              if (nextChunk) {
                controller.enqueue(nextChunk);
                return;
              }

              controller.close();
              state.readToEndIndexes.push(index);
            },
          },
          { highWaterMark: 0 }
        );

        return new Response(body, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      };
    },
    { responseTexts, stubKey: STALE_STUB_KEY }
  );
}

test("stale 가드: 취소가 전달되지 않아도 교체 전 요청의 늦은 응답은 화면·토스트·저장에 반영되지 않는다", async ({
  page,
  mocks,
}) => {
  const { getGeminiRequestCount, analysesPosts, wordsPosts } = mocks;

  await stubSignalIgnoringGeminiStream({
    page,
    responseTexts: [JSON.stringify(A_WORDS), JSON.stringify(B_WORDS)],
  });

  const readStubState = async () => {
    const state = await page.evaluate((stubKey) => {
      const { requestCount, readToEndIndexes } = (
        window as unknown as Record<string, IStaleStubState>
      )[stubKey];

      return { requestCount, readToEndIndexes };
    }, STALE_STUB_KEY);

    return { state };
  };

  const releaseStream = async ({ index }: { index: number }) => {
    await page.evaluate(
      ({ stubKey, streamIndex }) => {
        (window as unknown as Record<string, IStaleStubState>)[stubKey].release(
          streamIndex
        );
      },
      { stubKey: STALE_STUB_KEY, streamIndex: index }
    );
  };

  // 1. A 업로드 → 요청 0 붙잡힘
  await page.goto("/");
  await page.getByRole("combobox", { name: "추출 언어" }).selectOption("en");
  await page
    .locator('input[type="file"][aria-label="파일 업로드"]')
    .setInputFiles(ENGLISH_SAMPLE_PATH);

  await expect
    .poll(async () => {
      return (await readStubState()).state.requestCount;
    })
    .toBe(1);

  // 2. 분석 중 FAB로 B 업로드 → 요청 1
  await page.locator('input[aria-label="새 파일 업로드"]').setInputFiles({
    name: "b.png",
    mimeType: "image/png",
    buffer: readFileSync(ENGLISH_SAMPLE_PATH),
  });

  await expect
    .poll(async () => {
      return (await readStubState()).state.requestCount;
    })
    .toBe(2);

  // 3. B 먼저 완료 → B 결과, 성공 안내 1번, 저장 1번
  await releaseStream({ index: 1 });

  await expect(page.locator('[id="word-card-bravo"]')).toBeVisible();
  await expect(page.getByText(SUCCESS_TOAST)).toHaveCount(1);
  await expect.poll(() => wordsPosts.length).toBe(1);

  expect(analysesPosts).toHaveLength(1);
  expect(analysesPosts[0].image_name).toBe("b.png");

  // 4. A 스트림을 끝까지(정상 JSON + STOP) 흘려보낸다. 취소가 안 먹으니 A도 완료까지 소비된다
  await releaseStream({ index: 0 });

  await expect
    .poll(async () => {
      return (await readStubState()).state.readToEndIndexes;
    })
    .toContain(0);

  // 끝까지 읽힌 뒤 소비·정규화·setState·저장 요청이 일어날 수 있는 시간을 준다
  // (가드를 빼면 이 사이에 A 카드·두 번째 성공 토스트·두 번째 저장이 생긴다)
  await page.waitForTimeout(500);

  await expect(page.locator('[id="word-card-alpha"]')).toHaveCount(0);
  await expect(page.locator('[id="word-card-bravo"]')).toBeVisible();
  await expect(page.getByText(SUCCESS_TOAST)).toHaveCount(1);
  await expect(page.locator(TOAST_SELECTOR)).toHaveCount(1);

  // stub이 응답했으므로 Gemini route(네트워크)까지 간 요청은 없어야 한다
  expect(getGeminiRequestCount().count).toBe(0);

  // 즉시 평가되는 부정 단언이라 맨 끝에 둔다
  expect(analysesPosts).toHaveLength(1);
  expect(wordsPosts).toHaveLength(1);
});
