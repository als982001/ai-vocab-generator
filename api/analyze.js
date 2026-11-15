// api/analyze.js
import { ApiError, GoogleGenAI } from "@google/genai";

import {
  ANALYSIS_STREAM_CONTENT_TYPE,
  UPSTREAM_API_KEY_ERROR_MARKERS,
  UPSTREAM_FILE_PROCESSING_ERROR_MARKERS,
} from "../shared/constants/analysisStream.js";
import {
  GEMINI_3_FLASH_PREVIEW,
  SUPPORTED_LANGUAGES,
  buildAnalyzePrompt,
} from "../shared/constants/prompt.js";
import { buildWordResponseSchema } from "../shared/constants/wordSchema.js";
import { toAnalysisStreamEvents } from "../shared/utils/geminiStream.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

/**
 * 스트림 시작 전 오류를 JSON으로 응답 ({ error: 한국어 안내, code })
 * @param response Node 응답 객체
 * @param status HTTP 상태 코드
 * @param code ANALYSIS_HTTP_ERROR_CODES 중 하나
 * @param message 사용자에게 보여도 되는 한국어 문구 (상류 error.message는 절대 넣지 않는다)
 */
function sendHttpError({ response, status, code, message }) {
  response.status(status).json({ error: message, code });
}

const UPSTREAM_ERROR = {
  status: 502,
  code: "UPSTREAM_ERROR",
  message: "AI 서버에서 오류가 발생했습니다.",
};

const INTERNAL_ERROR = {
  status: 500,
  code: "INTERNAL_ERROR",
  message: "서버 오류가 발생했습니다.",
};

/**
 * 상류 오류 메시지에 표시 문자열 중 하나가 들어 있는지 확인
 * @param message 상류 오류 메시지
 * @param markers 찾을 표시 문자열 목록
 * @return hasMarker 하나라도 들어 있는지
 */
function includesMarker({ message, markers }) {
  return {
    hasMarker: markers.some((marker) => {
      return message.includes(marker);
    }),
  };
}

/**
 * 스트림을 열기 전에 난 예외를 HTTP 오류로 분류
 * - 상류 429 → 429 RATE_LIMITED
 * - 상류 400 + API 키 메시지 → 500 INTERNAL_ERROR (서버 설정 문제)
 * - 상류 400 + 파일 처리 불가 메시지 → 400 UPSTREAM_BAD_REQUEST (사용자 파일 문제는 이 경우만)
 * - 상류 그 외 400·4xx(401/403/404/422 등)·5xx → 502 UPSTREAM_ERROR (요청·스키마·권한 등 우리 쪽 또는 상류 문제)
 * - 그 외(키 없음, fetch 실패 등) → 500 INTERNAL_ERROR
 * 응답 문구는 고정 한국어. 상류 메시지 원문은 호출부의 console.error로만 남긴다
 * @param error catch로 잡은 값
 * @return status, code, message 응답할 HTTP 오류
 */
function getUpstreamHttpError({ error }) {
  if (!(error instanceof ApiError)) return { ...INTERNAL_ERROR };

  if (error.status === 429) {
    return {
      status: 429,
      code: "RATE_LIMITED",
      message: "요청이 많습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  if (error.status !== 400) return { ...UPSTREAM_ERROR };

  const message = typeof error.message === "string" ? error.message : "";

  const { hasMarker: isApiKeyError } = includesMarker({
    message,
    markers: UPSTREAM_API_KEY_ERROR_MARKERS,
  });

  if (isApiKeyError) return { ...INTERNAL_ERROR };

  const { hasMarker: isFileProcessingError } = includesMarker({
    message,
    markers: UPSTREAM_FILE_PROCESSING_ERROR_MARKERS,
  });

  if (isFileProcessingError) {
    return {
      status: 400,
      code: "UPSTREAM_BAD_REQUEST",
      message: "분석 요청이 거부되었습니다.",
    };
  }

  return { ...UPSTREAM_ERROR };
}

export default async function handler(request, response) {
  // CORS 설정 — 현재 모든 도메인 허용 상태
  // TODO: 보안을 위해 ALLOWED_ORIGIN 환경변수 기반으로 허용 도메인을 제한하는 것이 필요한지 확인 후 수정
  response.setHeader("Access-Control-Allow-Credentials", true);
  response.setHeader("Access-Control-Allow-Origin", "*");

  if (request.method !== "POST") {
    sendHttpError({
      response,
      status: 405,
      code: "METHOD_NOT_ALLOWED",
      message: "Method Not Allowed",
    });
    return;
  }

  // language가 없으면 일본어로 처리 (언어 선택 이전 버전 클라이언트 호환)
  const { imageBase64, mimeType, language = "ja" } = request.body ?? {}; // 프론트에서 받은 이미지

  if (!imageBase64 || !mimeType) {
    sendHttpError({
      response,
      status: 400,
      code: "INVALID_REQUEST",
      message: "imageBase64와 mimeType은 필수입니다.",
    });
    return;
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    sendHttpError({
      response,
      status: 400,
      code: "INVALID_REQUEST",
      message: "지원하지 않는 파일 형식입니다.",
    });
    return;
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    sendHttpError({
      response,
      status: 400,
      code: "INVALID_REQUEST",
      message: "지원하지 않는 언어입니다.",
    });
    return;
  }

  // 클라이언트가 연결을 끊으면(취소·탭 닫기) 상류 Gemini 요청도 끊는다.
  // request의 close는 본문을 다 읽으면 발생할 수 있어 response의 close를 본다
  // (정상 종료 후의 close는 writableFinished가 true라 무시)
  const abortController = new AbortController();

  response.on("close", () => {
    if (!response.writableFinished) {
      abortController.abort();
    }
  });

  let stream;

  try {
    // 서버 환경변수는 VITE_ 안 붙여도 됨 (보안 안전)
    // 새 SDK 기본값은 v1. 이전 SDK(0.24.1)와 같은 v1beta 엔드포인트를 유지한다
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { apiVersion: "v1beta" },
    });

    const fileType = mimeType === "application/pdf" ? "pdf" : "image";

    const { prompt } = buildAnalyzePrompt({ language, fileType });
    const { schema } = buildWordResponseSchema({ language, fileType });

    // 이미지 객체 생성
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    stream = await ai.models.generateContentStream({
      model: GEMINI_3_FLASH_PREVIEW,
      contents: [prompt, imagePart],
      // 응답 형식을 API 설정으로 강제 (JSON 문법만 보장, 값 검증은 클라이언트 normalizeWords가 담당)
      // automaticContinuation: 끊긴 응답을 SDK가 몰래 이어 붙이지 않게 끈다 (끊기면 클라이언트가 incomplete로 처리)
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        abortSignal: abortController.signal,
        automaticContinuation: false,
      },
    });
  } catch (error) {
    // 클라이언트가 이미 떠났으면 응답할 곳이 없다
    if (abortController.signal.aborted) {
      if (!response.writableEnded) response.end();
      return;
    }

    console.error(error);

    const { status, code, message } = getUpstreamHttpError({ error });

    sendHttpError({ response, status, code, message });
    return;
  }

  // 여기부터는 200 + NDJSON. 이후 오류는 상태 코드 대신 error 이벤트 줄로 알린다
  response.writeHead(200, {
    "Content-Type": ANALYSIS_STREAM_CONTENT_TYPE,
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  });
  response.flushHeaders?.();

  try {
    for await (const event of toAnalysisStreamEvents({ stream })) {
      if (abortController.signal.aborted || response.writableEnded) break;

      response.write(`${JSON.stringify(event)}\n`);
    }
  } catch (error) {
    console.error(error);

    // 취소로 끊긴 경우는 받을 사람이 없으니 오류 줄을 쓰지 않는다
    if (!abortController.signal.aborted && !response.writableEnded) {
      // SSE 오류 청크(ApiError)는 상류 오류, 그 외(연결 끊김·잘린 SSE)는 끝까지 못 받음
      // (클라이언트 로컬 경로의 분류와 맞춘다)
      const code =
        error instanceof ApiError ? "STREAM_ERROR" : "INCOMPLETE_STREAM";

      response.write(`${JSON.stringify({ type: "error", code })}\n`);
    }
  } finally {
    if (!response.writableEnded) response.end();
  }
}
