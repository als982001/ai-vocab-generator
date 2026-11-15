import {
  ANALYSIS_HTTP_ERROR_CODES,
  UPSTREAM_API_KEY_ERROR_MARKERS,
  UPSTREAM_FILE_PROCESSING_ERROR_MARKERS,
} from "../../shared/constants/analysisStream";
// 순수 테스트(e2e/analysis-error-kind.spec.ts)가 tsconfig.e2e로 불러오므로 `~` alias 대신 상대경로를 쓴다
import type {
  AnalysisErrorKind,
  AnalysisHttpErrorCode,
  AnalysisStreamErrorCode,
} from "../types";

// 분석 실패를 원인(kind)과 함께 전달하는 오류. 화면 문구는 kind로만 고른다
export class AnalysisError extends Error {
  readonly kind: AnalysisErrorKind;

  constructor({
    kind,
    message,
    cause,
  }: {
    kind: AnalysisErrorKind;
    message: string;
    cause?: unknown;
  }) {
    super(message, { cause });

    this.name = "AnalysisError";
    this.kind = kind;
  }
}

const STREAM_ERROR_KINDS: Record<AnalysisStreamErrorCode, AnalysisErrorKind> = {
  STREAM_ERROR: "server",
  INCOMPLETE_STREAM: "incomplete",
};

/**
 * 스트림 error 이벤트의 code를 실패 원인으로 바꿈
 * @param code 스트림 error 이벤트의 code
 * @return kind 실패 원인
 */
export function getKindFromStreamErrorCode({
  code,
}: {
  code: AnalysisStreamErrorCode;
}): { kind: AnalysisErrorKind } {
  return { kind: STREAM_ERROR_KINDS[code] };
}

// 요청 내용(파일 형식·크기·본문) 때문에 거부됐다고 볼 수 있는 상태 코드만 client
// 401/403/404 같은 설정·권한 오류와 429·5xx는 사용자가 파일을 바꿔도 해결되지 않아 server
const CLIENT_HTTP_STATUSES = [400, 413, 415, 422];

// 서버(/api/analyze)가 붙인 code 중 요청 내용 때문에 거부된 경우
const CLIENT_HTTP_ERROR_CODES: AnalysisHttpErrorCode[] = [
  "INVALID_REQUEST",
  "UPSTREAM_BAD_REQUEST",
];

/**
 * HTTP 상태 코드를 실패 원인으로 바꿈
 * @param status HTTP 상태 코드
 * @return kind 400·413·415·422는 client, 그 외(401/403/404/429/5xx 등)는 server
 */
export function getKindFromHttpStatus({ status }: { status: number }): {
  kind: AnalysisErrorKind;
} {
  return {
    kind: CLIENT_HTTP_STATUSES.includes(status) ? "client" : "server",
  };
}

/**
 * /api/analyze 오류 응답 본문의 code를 실패 원인으로 바꿈
 * @param code 오류 응답 본문의 code 값 (알 수 없는 값이면 판단하지 않음)
 * @return kind 요청 거부 code면 client, 그 외 알려진 code면 server, 알 수 없으면 null
 */
export function getKindFromHttpErrorCode({ code }: { code: unknown }): {
  kind: AnalysisErrorKind | null;
} {
  const knownCode = ANALYSIS_HTTP_ERROR_CODES.find((errorCode) => {
    return errorCode === code;
  });

  if (!knownCode) return { kind: null };

  return {
    kind: CLIENT_HTTP_ERROR_CODES.includes(knownCode) ? "client" : "server",
  };
}

/**
 * 상류(Gemini) HTTP 오류를 실패 원인으로 바꿈 (로컬 경로에서 SDK ApiError를 받을 때)
 * - 400: 파일 처리 불가 메시지일 때만 client. API 키 메시지·그 외 400(요청·스키마 문제)은 server
 * - 그 외 상태(413·415·422 포함): server. 서버 경로(api/analyze.js getUpstreamHttpError)와 같은 기준
 *   (getKindFromHttpStatus는 우리 서버·Vercel 응답용이라 상류 상태 코드에는 쓰지 않는다)
 * @param status 상류 HTTP 상태 코드
 * @param message 상류 오류 메시지 (SDK ApiError.message = 상류 오류 본문 JSON)
 * @return kind 실패 원인
 */
export function getKindFromUpstreamError({
  status,
  message,
}: {
  status: number;
  message: string;
}): { kind: AnalysisErrorKind } {
  if (status !== 400) return { kind: "server" };

  const hasMarker = (markers: readonly string[]) => {
    return markers.some((marker) => {
      return message.includes(marker);
    });
  };

  if (hasMarker(UPSTREAM_API_KEY_ERROR_MARKERS)) return { kind: "server" };

  if (hasMarker(UPSTREAM_FILE_PROCESSING_ERROR_MARKERS)) {
    return { kind: "client" };
  }

  return { kind: "server" };
}

/**
 * 오류가 사용자의 취소(AbortController.abort)로 생긴 것인지 판별
 * (취소는 실패가 아니라 안내·로그 없이 조용히 끝내야 한다)
 * @param error catch로 잡은 값
 * @param signal 요청에 넘긴 AbortSignal (이미 취소됐으면 오류 종류와 무관하게 취소로 본다)
 * @return isAbort 취소로 생긴 오류인지
 */
export function isAbortError({
  error,
  signal,
}: {
  error: unknown;
  signal?: AbortSignal;
}): { isAbort: boolean } {
  if (signal?.aborted) return { isAbort: true };

  const isAbortName =
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError";

  return { isAbort: isAbortName };
}
