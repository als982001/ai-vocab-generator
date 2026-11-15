import { GoogleGenAI } from "@google/genai";
import type { IWord, Language } from "~/types";
import { isLocalEnvironment } from "~/utils/env";
import { normalizeWords } from "~/utils/word";

import {
  GEMINI_3_FLASH_PREVIEW,
  buildAnalyzePrompt,
} from "../../shared/constants/prompt";
import { buildWordResponseSchema } from "../../shared/constants/wordSchema";

const analyzeImageLocal = async ({
  imagePart,
  prompt,
  responseSchema,
}: {
  imagePart: {
    inlineData: {
      data: string;
      mimeType: string;
    };
  };
  prompt: string;
  responseSchema: Record<string, unknown>;
}): Promise<{ rawWords: unknown }> => {
  // 새 SDK 기본값은 v1. 이전 SDK(0.24.1)와 같은 v1beta 엔드포인트를 유지한다
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    httpOptions: { apiVersion: "v1beta" },
  });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_3_FLASH_PREVIEW,
      contents: [prompt, imagePart],
      // 응답 형식을 API 설정으로 강제 (JSON 문법만 보장, 값 검증은 normalizeWords가 담당)
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: responseSchema,
      },
    });

    // 새 SDK의 text는 메서드가 아니라 getter (차단 등으로 텍스트가 없으면 undefined → 파싱 실패)
    const rawWords: unknown = JSON.parse(response.text ?? "");

    return { rawWords };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

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
 * 파일에서 선택한 언어의 단어를 추출 (로컬: Gemini 직접 호출, 배포: /api/analyze)
 * @param file 업로드한 이미지 또는 PDF
 * @param language 추출할 언어
 * @return words 등급 정규화와 중복 제거를 마친 단어 목록
 */
export const analyzeDocument = async ({
  file,
  language,
}: {
  file: File;
  language: Language;
}): Promise<{ words: IWord[] }> => {
  if (!file.type) throw new Error("지원하지 않는 파일 형식입니다.");

  // 1. 파일을 Base64로 변환 (기존 함수 활용)
  const imagePart = await fileToGenerativePart(file);
  const base64Data = imagePart.inlineData.data;

  // 로컬 환경: 클라이언트에서 직접 Gemini API 호출
  if (isLocalEnvironment()) {
    const fileType = file.type === "application/pdf" ? "pdf" : "image";

    const { prompt } = buildAnalyzePrompt({ language, fileType });
    const { schema } = buildWordResponseSchema({ language, fileType });

    const { rawWords } = await analyzeImageLocal({
      imagePart,
      prompt,
      responseSchema: schema,
    });

    return normalizeWords({ rawWords, language });
  }

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64: base64Data,
      mimeType: file.type,
      language,
    }),
  });

  if (!response.ok) throw new Error("분석 실패");

  const rawWords: unknown = await response.json();

  return normalizeWords({ rawWords, language });
};
