import { test as base, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { seedAuthSession } from "./auth";
import {
  type GeminiResponseMode,
  type IGate,
  type IGeminiMockResponse,
  installLeakGuard,
  mockGemini,
  mockSupabase,
} from "./network";

export interface IFixtureWord {
  word: string;
  reading: string;
  meaning: string;
  level: string;
  part_of_speech: string;
  box_2d: number[];
}

const RESPONSE_PATH = fileURLToPath(
  new URL("../fixtures/english-response.json", import.meta.url)
);

export const ENGLISH_SAMPLE_PATH = fileURLToPath(
  new URL("../fixtures/english-sentences.png", import.meta.url)
);

export const ENGLISH_WORDS = JSON.parse(
  readFileSync(RESPONSE_PATH, "utf-8")
) as IFixtureWord[];

interface IMocks {
  geminiGate: IGate; // 첫 번째 요청의 gate (geminiGateAt({ index: 0 })와 같음)
  geminiGateAt: ({ index }: { index: number }) => { gate: IGate };
  getGeminiRequestCount: () => { count: number };
  getGeminiSettledCount: () => { count: number };
  abortedGeminiRequests: number[]; // 페이지가 취소한 Gemini 요청 index
  analysesPosts: Record<string, unknown>[];
  wordsPosts: Record<string, unknown>[][];
}

interface IFixtureOptions {
  geminiResponse: GeminiResponseMode;
  geminiWords: unknown;
  geminiResponseText: string | null;
  geminiFinishReason: string | null;
  geminiResponses: IGeminiMockResponse[] | null;
}

export const test = base.extend<IFixtureOptions & { mocks: IMocks }>({
  // 실패 시나리오는 파일 상단에서 test.use({ geminiResponse: "error" })로 전환
  geminiResponse: ["success", { option: true }],

  // 검증 시나리오는 test.use로 모델 응답(단어 배열 또는 원문 텍스트)을 바꾼다
  geminiWords: [ENGLISH_WORDS, { option: true }],
  geminiResponseText: [null, { option: true }],
  geminiFinishReason: ["STOP", { option: true }],

  // 요청마다 다른 응답이 필요하면 순서대로 지정 (위 단일 응답 옵션들보다 우선)
  // 배열 값이라 test.use에서 [값, { scope: "test" }] 튜플로 감싸야 한다 (타입이 { option: true }를 거부)
  geminiResponses: [null, { option: true }],

  // auto: 모든 테스트가 가드·세션·mock을 거치게 강제
  mocks: [
    async (
      {
        context,
        geminiResponse,
        geminiWords,
        geminiResponseText,
        geminiFinishReason,
        geminiResponses,
      },
      use
    ) => {
      // 순서 중요: 누수 가드를 먼저 등록해야 개별 mock이 우선한다
      const { blockedUrls } = await installLeakGuard({ context });
      const {
        getGate,
        releaseAll,
        getRequestCount,
        getSettledCount,
        abortedGeminiRequests,
      } = await mockGemini({
        context,
        responses: geminiResponses ?? [
          {
            mode: geminiResponse,
            words: geminiWords,
            responseText: geminiResponseText,
            finishReason: geminiFinishReason,
          },
        ],
      });
      const { analysesPosts, wordsPosts } = await mockSupabase({ context });

      await seedAuthSession({ context });

      await use({
        geminiGate: getGate({ index: 0 }).gate,
        geminiGateAt: getGate,
        getGeminiRequestCount: getRequestCount,
        getGeminiSettledCount: getSettledCount,
        abortedGeminiRequests,
        analysesPosts,
        wordsPosts,
      });

      // 테스트가 중간에 실패해도 붙잡힌 응답을 풀고 route를 정리한다
      releaseAll();
      await context.unrouteAll({ behavior: "ignoreErrors" });

      expect(blockedUrls, "처리되지 않은 외부 요청이 발생했어").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
