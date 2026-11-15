import { ApiError, GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import {
  consumeAnalysisStream,
  readRemoteAnalysisEvents,
} from "~/services/analysisStream";
import type {
  AnalysisStreamEvent,
  IAnalyzeProgress,
  IWord,
  Language,
} from "~/types";
import {
  AnalysisError,
  getKindFromHttpErrorCode,
  getKindFromHttpStatus,
  getKindFromUpstreamError,
  isAbortError,
} from "~/utils/analysisError";
import { isLocalEnvironment } from "~/utils/env";

import {
  GEMINI_3_FLASH_PREVIEW,
  buildAnalyzePrompt,
} from "../../shared/constants/prompt";
import { buildWordResponseSchema } from "../../shared/constants/wordSchema";
import { toAnalysisStreamEvents } from "../../shared/utils/geminiStream";

/**
 * 로컬 환경에서 Gemini를 스트리밍으로 직접 호출해 분석 스트림 이벤트로 내보냄
 * - 스트림 열기 실패: 취소면 그대로, ApiError는 getKindFromUpstreamError로(400은 파일 처리 불가만 client), TypeError(fetch 실패)는 network, 그 외 server
 * - 반복 중 실패: 취소면 그대로, ApiError(SSE 오류 청크)는 server, 그 외(연결 끊김·잘린 SSE)는 incomplete
 * @param imagePart Base64로 변환한 파일
 * @param prompt 분석 프롬프트
 * @param responseSchema 응답 JSON Schema (responseJsonSchema)
 * @param signal 요청 취소 신호
 * @return 분석 스트림 이벤트를 내보내는 async generator
 */
async function* streamAnalysisLocal({
  imagePart,
  prompt,
  responseSchema,
  signal,
}: {
  imagePart: {
    inlineData: {
      data: string;
      mimeType: string;
    };
  };
  prompt: string;
  responseSchema: Record<string, unknown>;
  signal: AbortSignal;
}): AsyncGenerator<AnalysisStreamEvent, void, undefined> {
  // 새 SDK 기본값은 v1. 이전 SDK(0.24.1)와 같은 v1beta 엔드포인트를 유지한다
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    httpOptions: { apiVersion: "v1beta" },
  });

  let stream: AsyncGenerator<GenerateContentResponse>;

  try {
    stream = await ai.models.generateContentStream({
      model: GEMINI_3_FLASH_PREVIEW,
      contents: [prompt, imagePart],
      // 응답 형식을 API 설정으로 강제 (JSON 문법만 보장, 값 검증은 normalizeWords가 담당)
      // automaticContinuation: 끊긴 응답을 SDK가 몰래 이어 붙이지 않게 끈다 (끊기면 incomplete로 처리)
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: responseSchema,
        abortSignal: signal,
        automaticContinuation: false,
      },
    });
  } catch (error) {
    if (isAbortError({ error, signal }).isAbort) throw error;

    console.error(error);

    if (error instanceof ApiError) {
      // 400은 메시지로 가른다: 파일 처리 불가만 client, API 키·요청 문제는 server
      const { kind } = getKindFromUpstreamError({
        status: error.status,
        message: error.message,
      });

      throw new AnalysisError({
        kind,
        message: "Gemini 요청이 실패했습니다.",
        cause: error,
      });
    }

    if (error instanceof TypeError) {
      throw new AnalysisError({
        kind: "network",
        message: "Gemini에 연결할 수 없습니다.",
        cause: error,
      });
    }

    throw new AnalysisError({
      kind: "server",
      message: "Gemini 요청 중 오류가 발생했습니다.",
      cause: error,
    });
  }

  try {
    yield* toAnalysisStreamEvents({ stream });
  } catch (error) {
    if (isAbortError({ error, signal }).isAbort) throw error;

    console.error(error);

    if (error instanceof ApiError) {
      throw new AnalysisError({
        kind: "server",
        message: "Gemini 스트림 도중 오류가 발생했습니다.",
        cause: error,
      });
    }

    throw new AnalysisError({
      kind: "incomplete",
      message: "Gemini 스트림이 도중에 끊겼습니다.",
      cause: error,
    });
  }
}

/**
 * HTTP 오류 응답 본문에서 서버가 붙인 code를 읽음 (로그 용도, 실패해도 null)
 * @param response ok가 아닌 fetch 응답
 * @return code 본문의 code 문자열 또는 null
 */
async function readHttpErrorCode({
  response,
}: {
  response: Response;
}): Promise<{ code: string | null }> {
  try {
    const body: unknown = await response.json();

    const code =
      typeof body === "object" &&
      body !== null &&
      "code" in body &&
      typeof body.code === "string"
        ? body.code
        : null;

    return { code };
  } catch {
    return { code: null };
  }
}

/**
 * 배포 환경에서 /api/analyze를 호출해 NDJSON 스트림을 분석 스트림 이벤트로 내보냄
 * - fetch 실패: 취소면 그대로, 그 외 network
 * - HTTP 오류(스트림 시작 전): 본문 code로 분류, code가 없거나 모르는 값이면 상태 코드로 분류
 * - NDJSON이 아니거나 본문 없음: server
 * - 읽는 도중 실패: 취소면 그대로, 형식 오류(AnalysisError)는 그대로, 그 외(연결 끊김) incomplete
 * @param imageBase64 Base64로 변환한 파일 데이터
 * @param mimeType 파일 MIME 타입
 * @param language 추출 언어
 * @param signal 요청 취소 신호
 * @return 분석 스트림 이벤트를 내보내는 async generator
 */
async function* streamAnalysisRemote({
  imageBase64,
  mimeType,
  language,
  signal,
}: {
  imageBase64: string;
  mimeType: string;
  language: Language;
  signal: AbortSignal;
}): AsyncGenerator<AnalysisStreamEvent, void, undefined> {
  let response: Response;

  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType, language }),
      signal,
    });
  } catch (error) {
    if (isAbortError({ error, signal }).isAbort) throw error;

    console.error(error);

    throw new AnalysisError({
      kind: "network",
      message: "분석 서버에 연결할 수 없습니다.",
      cause: error,
    });
  }

  if (!response.ok) {
    const { code } = await readHttpErrorCode({ response });

    // 서버가 붙인 code가 있으면 그걸로, 없으면(플랫폼 413 등) 상태 코드로 분류
    const { kind: kindFromCode } = getKindFromHttpErrorCode({ code });
    const { kind: kindFromStatus } = getKindFromHttpStatus({
      status: response.status,
    });
    const kind = kindFromCode ?? kindFromStatus;

    const analysisError = new AnalysisError({
      kind,
      message: `분석 요청 실패: ${response.status} ${code ?? "코드 없음"}`,
    });

    console.error(analysisError);

    throw analysisError;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("ndjson") || !response.body) {
    const analysisError = new AnalysisError({
      kind: "server",
      message: `분석 응답 형식이 스트림이 아닙니다: ${contentType || "content-type 없음"}`,
    });

    console.error(analysisError);

    throw analysisError;
  }

  try {
    yield* readRemoteAnalysisEvents({ body: response.body });
  } catch (error) {
    if (isAbortError({ error, signal }).isAbort) throw error;

    console.error(error);

    // 이벤트·줄 형식 오류는 readRemoteAnalysisEvents가 이미 server로 분류했다
    if (error instanceof AnalysisError) throw error;

    throw new AnalysisError({
      kind: "incomplete",
      message: "분석 스트림이 도중에 끊겼습니다.",
      cause: error,
    });
  }
}

// 이미지를 AI가 이해할 수 있는 포맷(Base64)으로 변환하는 헬퍼 함수
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

/**
 * 파일에서 선택한 언어의 단어를 추출 (로컬: Gemini 직접 스트리밍 호출, 배포: /api/analyze NDJSON 스트림)
 * @param file 업로드한 이미지 또는 PDF
 * @param language 추출할 언어
 * @param signal 요청 취소 신호 (취소되면 AbortError 계열 오류로 끝난다)
 * @param onProgress 스트리밍 중 잠정 단어 목록을 받을 콜백 (최종 결과 아님)
 * @return words 등급 정규화와 중복 제거를 마친 단어 목록
 */
export const analyzeDocument = async ({
  file,
  language,
  signal,
  onProgress,
}: {
  file: File;
  language: Language;
  signal: AbortSignal;
  onProgress?: (progress: IAnalyzeProgress) => void;
}): Promise<{ words: IWord[] }> => {
  if (!file.type) {
    throw new AnalysisError({
      kind: "client",
      message: "지원하지 않는 파일 형식입니다.",
    });
  }

  // 1. 파일을 Base64로 변환 (기존 함수 활용)
  const imagePart = await fileToGenerativePart(file);

  // 변환하는 동안 취소됐으면 요청을 보내지 않는다
  signal.throwIfAborted();

  const fileType = file.type === "application/pdf" ? "pdf" : "image";

  const { prompt } = buildAnalyzePrompt({ language, fileType });
  const { schema } = buildWordResponseSchema({ language, fileType });

  // 로컬 환경: 클라이언트에서 직접 Gemini API 호출, 배포 환경: 서버(/api/analyze) 경유
  // 두 경로 모두 같은 분석 스트림 이벤트를 내보내고, 소비·검증은 한 곳에서 한다
  const events = isLocalEnvironment()
    ? streamAnalysisLocal({
        imagePart,
        prompt,
        responseSchema: schema,
        signal,
      })
    : streamAnalysisRemote({
        imageBase64: imagePart.inlineData.data,
        mimeType: file.type,
        language,
        signal,
      });

  const { words } = await consumeAnalysisStream({
    events,
    language,
    onProgress,
  });

  return { words };
};
