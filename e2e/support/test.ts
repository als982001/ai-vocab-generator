import { test as base, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { seedAuthSession } from "./auth";
import {
  type IGate,
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
  geminiGate: IGate;
  analysesPosts: Record<string, unknown>[];
  wordsPosts: Record<string, unknown>[][];
}

export const test = base.extend<{ mocks: IMocks }>({
  // auto: 모든 테스트가 가드·세션·mock을 거치게 강제
  mocks: [
    async ({ context }, use) => {
      // 순서 중요: 누수 가드를 먼저 등록해야 개별 mock이 우선한다
      const { blockedUrls } = await installLeakGuard({ context });
      const { gate } = await mockGemini({ context, words: ENGLISH_WORDS });
      const { analysesPosts, wordsPosts } = await mockSupabase({ context });

      await seedAuthSession({ context });

      await use({ geminiGate: gate, analysesPosts, wordsPosts });

      // 테스트가 중간에 실패해도 붙잡힌 응답을 풀고 route를 정리한다
      gate.release();
      await context.unrouteAll({ behavior: "ignoreErrors" });

      expect(blockedUrls, "처리되지 않은 외부 요청이 발생했어").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
