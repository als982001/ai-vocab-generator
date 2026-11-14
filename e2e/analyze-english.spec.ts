import { basename } from "node:path";

import { E2E_USER_ID } from "./support/auth";
import {
  E2E_ANALYSIS_ID,
  getGeminiPromptText,
  isGeminiRequest,
} from "./support/network";
import {
  ENGLISH_SAMPLE_PATH,
  ENGLISH_WORDS,
  expect,
  test,
} from "./support/test";

const LOCK_HINT = "파일을 제거하면 언어를 변경할 수 있어요";

test("영어 선택 → 업로드 → 분석 중 잠금 → 결과 표시 → 잠금 유지 → 제거 시 해제", async ({
  page,
  mocks,
}) => {
  const { geminiGate, analysesPosts, wordsPosts } = mocks;

  const languageSelect = page.getByRole("combobox", { name: "추출 언어" });
  const fileInput = page.locator(
    'input[type="file"][aria-label="파일 업로드"]'
  );

  // 1. 인증 가드를 세션으로 통과
  await page.goto("/");

  await expect(page).toHaveURL("/");
  await expect(languageSelect).toBeVisible();

  // 2. 영어 선택
  await languageSelect.selectOption("en");

  await expect(languageSelect).toHaveValue("en");
  await expect(page.getByText("CEFR Level (AI 추정)")).toBeVisible();

  // 3. 빠른 요청을 놓치지 않도록 업로드 전에 대기 등록
  const geminiRequestPromise = page.waitForRequest(
    (request) => isGeminiRequest({ request }).isGemini
  );

  // 4. 업로드
  await fileInput.setInputFiles(ENGLISH_SAMPLE_PATH);

  // 5. 응답을 붙잡은 상태에서 잠금 확인
  const geminiRequest = await geminiRequestPromise;

  // 선택한 언어가 분석 요청(프롬프트)까지 전달됐는지.
  // soft: 실패해도 흐름을 이어가 아래 level 단언까지 같이 보고한다
  // 이미지 base64가 실패 메시지를 덮지 않도록 텍스트 part(프롬프트)만 비교한다
  const { promptText } = getGeminiPromptText({
    body: geminiRequest.postDataJSON(),
  });

  expect.soft(promptText).toContain("extract English vocabulary");

  await expect(languageSelect).toBeDisabled();
  await expect(page.getByText(LOCK_HINT)).toBeVisible();
  await expect(page.getByText("이미지 분석 중...")).toBeVisible();

  // 6. 응답 해제 → 결과 표시
  geminiGate.release();

  for (const { word, meaning } of ENGLISH_WORDS) {
    const card = page.locator(`[id="word-card-${word}"]`);

    await expect(card).toContainText(word);
    await expect(card).toContainText(meaning);
  }

  await expect(page.getByText("분석을 성공했습니다.")).toBeVisible();

  // 7. 저장 요청 내용 검증 (언어 누락 같은 회귀 감지)
  await expect.poll(() => wordsPosts.length).toBe(1);

  expect(analysesPosts).toHaveLength(1);
  expect(analysesPosts[0]).toEqual({
    user_id: E2E_USER_ID,
    image_name: basename(ENGLISH_SAMPLE_PATH),
    language: "en",
  });

  const savedWords = wordsPosts[0];

  expect(savedWords.map((row) => row.word)).toEqual(
    ENGLISH_WORDS.map(({ word }) => word)
  );

  // 영어 등급(CEFR) 정규화를 거쳤는지. "ja"로 정규화되면 CEFR 등급이 null로 바뀐다
  expect(savedWords.map((row) => row.level)).toEqual(
    ENGLISH_WORDS.map(({ level }) => level)
  );

  for (const row of savedWords) {
    expect(row.analysis_id).toBe(E2E_ANALYSIS_ID);
    expect(row.user_id).toBe(E2E_USER_ID);
  }

  // 8. 결과 후에도 잠금 유지
  await expect(languageSelect).toBeDisabled();

  // 9. 파일 제거 → 잠금 해제
  await page.getByRole("button", { name: "파일 제거" }).click();

  await expect(languageSelect).toBeEnabled();
  await expect(page.getByText(LOCK_HINT)).toBeHidden();
});
