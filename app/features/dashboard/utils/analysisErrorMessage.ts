import type { AnalysisErrorKind } from "~/types";
import { AnalysisError } from "~/utils/analysisError";

const ERROR_MESSAGES: Record<AnalysisErrorKind, string> = {
  format: "AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.",
  incomplete: "분석 결과를 끝까지 받지 못했습니다. 다시 시도해주세요.",
  network: "네트워크 연결을 확인한 뒤 다시 시도해주세요.",
  client:
    "요청을 처리할 수 없습니다. 파일 형식과 크기를 확인한 뒤 다시 시도해주세요.",
  server: "파일 분석에 실패했습니다. 다시 시도해주세요.",
};

/**
 * 분석 실패 오류를 사용자에게 보여줄 안내 문구로 바꿈
 * @param error catch로 잡은 값 (AnalysisError가 아니면 server로 본다)
 * @return message 토스트에 띄울 한국어 문구
 */
export function getAnalysisErrorMessage({ error }: { error: unknown }): {
  message: string;
} {
  const kind = error instanceof AnalysisError ? error.kind : "server";

  return { message: ERROR_MESSAGES[kind] };
}
