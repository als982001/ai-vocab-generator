// api/analyze.js(서버)와 app(클라이언트)이 함께 쓰는 분석 스트림 프로토콜 정의.
// 서버가 Node ESM으로 직접 import하므로 런타임 import 없이 이 파일만으로 완결한다

// 서버 → 클라이언트 응답 형식: 줄마다 JSON 이벤트 하나 (NDJSON)
export const ANALYSIS_STREAM_CONTENT_TYPE =
  "application/x-ndjson; charset=utf-8";

export const ANALYSIS_STREAM_EVENT_TYPES = ["text", "done", "error"] as const;

// 스트림 도중 오류 코드 (HTTP 200 이후라 상태 코드 대신 이벤트로 알린다)
export const ANALYSIS_STREAM_ERROR_CODES = [
  "STREAM_ERROR", // 상류(Gemini) 스트림이 도중에 실패
  "INCOMPLETE_STREAM", // finishReason 없이 스트림이 끝남
] as const;

// 스트림 시작 전 HTTP 오류 응답 본문의 code
export const ANALYSIS_HTTP_ERROR_CODES = [
  "METHOD_NOT_ALLOWED",
  "INVALID_REQUEST",
  "UPSTREAM_BAD_REQUEST",
  "RATE_LIMITED",
  "UPSTREAM_ERROR",
  "INTERNAL_ERROR",
] as const;

// 상류(Gemini) 400 오류 메시지로 원인을 가르는 표시 (서버·클라이언트 로컬 경로 공통)
// - API 키 문제: 잘못된 키도 400으로 와서 상태 코드만으로는 구분되지 않는다 → 서버 설정 오류
export const UPSTREAM_API_KEY_ERROR_MARKERS = [
  "API key",
  "API_KEY_INVALID",
] as const;

// - 파일 처리 불가: 손상된 이미지 등. 이 경우만 사용자 파일 문제로 본다
//   (Preview에서 손상 이미지에 400 INVALID_ARGUMENT "Unable to process input image..." 확인)
export const UPSTREAM_FILE_PROCESSING_ERROR_MARKERS = [
  "Unable to process input",
] as const;

// 이 finishReason으로 끝나야만 응답을 끝까지 받은 것으로 본다
export const SUCCESS_FINISH_REASON = "STOP";

export type AnalysisStreamEventType =
  (typeof ANALYSIS_STREAM_EVENT_TYPES)[number];

export type AnalysisStreamErrorCode =
  (typeof ANALYSIS_STREAM_ERROR_CODES)[number];

export type AnalysisHttpErrorCode = (typeof ANALYSIS_HTTP_ERROR_CODES)[number];

// 모델 텍스트 조각 (빈 문자열은 보내지 않는다)
export interface IAnalysisTextEvent {
  type: "text";
  text: string;
}

// 상류 finishReason을 그대로 전달. 정상 완료는 SUCCESS_FINISH_REASON뿐
export interface IAnalysisDoneEvent {
  type: "done";
  finishReason: string;
}

export interface IAnalysisErrorEvent {
  type: "error";
  code: AnalysisStreamErrorCode;
}

export type AnalysisStreamEvent =
  | IAnalysisTextEvent
  | IAnalysisDoneEvent
  | IAnalysisErrorEvent;
