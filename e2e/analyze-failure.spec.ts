import { isGeminiRequest } from "./support/network";
import { ENGLISH_SAMPLE_PATH, expect, test } from "./support/test";

const LOCK_HINT = "파일을 제거하면 언어를 변경할 수 있어요";
const ERROR_TOAST = "파일 분석에 실패했습니다. 다시 시도해주세요.";
const SUCCESS_TOAST = "분석을 성공했습니다.";

// 이 파일의 모든 테스트는 Gemini가 500을 돌려준다
test.use({ geminiResponse: "error" });

test("업로드 → 분석 중 잠금 → 분석 실패 → 에러 안내 · 저장 안 함 → 잠금 유지 → 제거 시 해제", async ({
  page,
  mocks,
}) => {
  const { geminiGate, analysesPosts, wordsPosts } = mocks;

  const languageSelect = page.getByRole("combobox", { name: "추출 언어" });
  const fileInput = page.locator(
    'input[type="file"][aria-label="파일 업로드"]'
  );

  // 1. 인증 가드를 세션으로 통과
  // 언어는 기본값 그대로 둔다. 실패 흐름은 언어와 무관하다
  await page.goto("/");

  await expect(languageSelect).toBeEnabled();

  // 2. 빠른 요청을 놓치지 않도록 업로드 전에 대기 등록
  const geminiRequestPromise = page.waitForRequest(
    (request) => isGeminiRequest({ request }).isGemini
  );

  // 3. 업로드
  await fileInput.setInputFiles(ENGLISH_SAMPLE_PATH);

  // 4. 응답을 붙잡은 상태에서 잠금 확인
  await geminiRequestPromise;

  await expect(languageSelect).toBeDisabled();
  await expect(page.getByText(LOCK_HINT)).toBeVisible();
  await expect(page.getByText("이미지 분석 중...")).toBeVisible();

  // 5. 응답 해제 → 500 → 에러 안내
  geminiGate.release();

  await expect(page.getByText(ERROR_TOAST)).toBeVisible();
  await expect(page.getByText(SUCCESS_TOAST)).toBeHidden();

  // 6. 로딩 종료, 결과는 비어 있음
  await expect(page.getByText("잠시만 기다려주세요")).toBeHidden();
  await expect(page.locator('[id^="word-card-"]')).toHaveCount(0);
  await expect(page.getByText("아직 분석된 단어가 없습니다")).toBeVisible();

  // 7. 실패 결과가 저장되지 않았는지
  // 저장 호출은 성공 토스트와 같은 분기에 있어, 에러 토스트가 보인 시점이면 이미 결정돼 있다
  expect(analysesPosts).toHaveLength(0);
  expect(wordsPosts).toHaveLength(0);

  // 8. 실패 후에도 파일이 남아 있어 잠금 유지
  await expect(languageSelect).toBeDisabled();
  await expect(page.getByText(LOCK_HINT)).toBeVisible();

  // 9. 파일 제거 → 잠금 해제 (다시 시도할 수 있는 상태)
  await page.getByRole("button", { name: "파일 제거" }).click();

  await expect(languageSelect).toBeEnabled();
  await expect(page.getByText(LOCK_HINT)).toBeHidden();
});
