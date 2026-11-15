import type { Page } from "@playwright/test";

import { isGeminiRequest } from "./support/network";
import { ENGLISH_SAMPLE_PATH, expect, test } from "./support/test";

const SUCCESS_TOAST = "분석을 성공했습니다.";
// 응답을 끝까지 받았지만 형식이 잘못된 경우의 안내 (format)
const ERROR_TOAST = "AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.";

// 이미지 위 좌표 박스 (BoundingBoxOverlay가 그리는 요소)
const BOUNDING_BOX_SELECTOR = "div.absolute.inset-0 > div.absolute.border-2";

// 보정·제외 정책을 한 번에 태우는 모델 응답
const MIXED_WORDS = [
  // 등급 "b2+" → B2, 범위 밖 좌표 → 0~1000으로 자름, 정의 밖 필드는 버림
  {
    word: "apple",
    reading: "/ˈæp.əl/",
    meaning: "사과",
    part_of_speech: "noun",
    level: "b2+",
    box_2d: [-10, 100, 1200, 300],
    confidence: 0.9,
  },
  // 대소문자·공백만 다른 중복 → 제외 (먼저 나온 apple 유지)
  { word: "Apple ", meaning: "중복", level: "A1", box_2d: [1, 2, 3, 4] },
  // word가 문자열이 아니거나 비어 있음, 객체가 아님 → 제외
  { word: 123, meaning: "숫자" },
  { word: "   ", meaning: "공백" },
  null,
  // 목록 밖 등급 → null(등급 미정), 숫자 3개 좌표 → 제거, 비문자열 meaning → ""
  {
    word: "banana",
    reading: "/bəˈnɑː.nə/",
    meaning: 5,
    level: "Z9",
    box_2d: [1, 2, 3],
  },
  // 뒤집힌 좌표(ymin > ymax) → 제거, 비문자열 품사 → 제거, 등급 누락 → null
  {
    word: "cherry",
    meaning: "체리",
    part_of_speech: 5,
    box_2d: [300, 100, 200, 400],
  },
  // 정상 항목
  {
    word: "date",
    reading: "/deɪt/",
    meaning: "날짜",
    part_of_speech: "noun",
    level: "C1",
    box_2d: [10, 20, 30, 40],
  },
];

/**
 * 영어를 선택하고 샘플 이미지를 올린 뒤 Gemini 응답을 풀어준다.
 * @param page Playwright 페이지
 * @param release 붙잡은 Gemini 응답을 푸는 함수
 */
async function uploadEnglishSample({
  page,
  release,
}: {
  page: Page;
  release: () => void;
}) {
  await page.goto("/");

  await page.getByRole("combobox", { name: "추출 언어" }).selectOption("en");

  const geminiRequestPromise = page.waitForRequest(
    (request) => isGeminiRequest({ request }).isGemini
  );

  await page
    .locator('input[type="file"][aria-label="파일 업로드"]')
    .setInputFiles(ENGLISH_SAMPLE_PATH);

  await geminiRequestPromise;

  release();
}

test.describe("항목 보정·제외", () => {
  // 배열 값은 Playwright가 [값, 옵션] 튜플로 해석하므로 반드시 튜플로 감싼다
  // (그냥 넘기면 첫 항목 객체가 값이 되어 "배열 아님"으로 거부된다)
  test.use({ geminiWords: [MIXED_WORDS, { option: true }] });

  test("잘못된 항목은 보정하거나 빼고, 좌표가 없는 단어도 카드로 보여주고 저장한다", async ({
    page,
    mocks,
  }) => {
    const { geminiGate, wordsPosts } = mocks;
    const pageErrors: string[] = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await uploadEnglishSample({ page, release: geminiGate.release });

    await expect(page.getByText(SUCCESS_TOAST)).toBeVisible();

    // 1. 화면: 살아남은 4개만 카드로, 좌표 박스는 유효한 2개(apple, date)만
    await expect(page.locator('[id^="word-card-"]')).toHaveCount(4);

    for (const word of ["apple", "banana", "cherry", "date"]) {
      await expect(page.locator(`[id="word-card-${word}"]`)).toBeVisible();
    }

    await expect(page.locator(BOUNDING_BOX_SELECTOR)).toHaveCount(2);

    // 2. 좌표가 제거된 단어 카드를 눌러도 스크롤 로직이 깨지지 않는다
    await page.locator('[id="word-card-banana"]').click();

    // 3. 저장: 보정된 값 그대로, 제거된 좌표·품사는 null
    await expect.poll(() => wordsPosts.length).toBe(1);

    const savedWords = wordsPosts[0].map(
      ({ word, reading, meaning, level, part_of_speech, box_2d }) => {
        return { word, reading, meaning, level, part_of_speech, box_2d };
      }
    );

    expect(savedWords).toEqual([
      {
        word: "apple",
        reading: "/ˈæp.əl/",
        meaning: "사과",
        level: "B2",
        part_of_speech: "noun",
        box_2d: [0, 100, 1000, 300],
      },
      {
        word: "banana",
        reading: "/bəˈnɑː.nə/",
        meaning: "",
        level: null,
        part_of_speech: null,
        box_2d: null,
      },
      {
        word: "cherry",
        reading: "",
        meaning: "체리",
        level: null,
        part_of_speech: null,
        box_2d: null,
      },
      {
        word: "date",
        reading: "/deɪt/",
        meaning: "날짜",
        level: "C1",
        part_of_speech: "noun",
        box_2d: [10, 20, 30, 40],
      },
    ]);

    expect(pageErrors).toEqual([]);
  });
});

// 응답 전체를 거부해야 하는 경우: 에러 안내, 결과 비움, 저장 안 함
const REJECTED_RESPONSES = [
  {
    name: "최상위가 배열이 아님",
    text: JSON.stringify({ words: MIXED_WORDS }),
  },
  { name: "JSON이 잘림", text: '[{"word": "apple", "meaning": "사' },
  { name: "텍스트가 비어 있음", text: "" },
];

for (const { name, text } of REJECTED_RESPONSES) {
  test.describe(`응답 거부: ${name}`, () => {
    test.use({ geminiResponseText: text });

    test(`${name} → 에러 안내 · 결과 없음 · 저장 안 함`, async ({
      page,
      mocks,
    }) => {
      const { geminiGate, analysesPosts, wordsPosts } = mocks;

      await uploadEnglishSample({ page, release: geminiGate.release });

      await expect(page.getByText(ERROR_TOAST)).toBeVisible();
      await expect(page.getByText(SUCCESS_TOAST)).toBeHidden();
      await expect(page.locator('[id^="word-card-"]')).toHaveCount(0);

      // 즉시 평가되는 부정 단언이라 맨 끝에 둔다
      expect(analysesPosts).toHaveLength(0);
      expect(wordsPosts).toHaveLength(0);
    });
  });
}
