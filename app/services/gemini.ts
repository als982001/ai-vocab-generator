import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IWord, Language } from "~/types";
import { isLocalEnvironment } from "~/utils/env";
import { normalizeWords } from "~/utils/word";

import {
  GEMINI_3_FLASH_PREVIEW,
  buildAnalyzePrompt,
} from "../../shared/constants/prompt";

const analyzeImageLocal = async (
  imagePart: {
    inlineData: {
      data: string;
      mimeType: string;
    };
  },
  prompt: string
): Promise<unknown> => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  try {
    // Gemini 1.5 Flash 모델 선택 (빠르고 저렴함)
    const model = genAI.getGenerativeModel({ model: GEMINI_3_FLASH_PREVIEW });

    // AI에게 요청 전송
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    // 혹시라도 마크다운(```json ... ```)이 섞여올 경우를 대비해 제거
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return JSON.parse(cleanJson);
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
    const { prompt } = buildAnalyzePrompt({
      language,
      fileType: file.type === "application/pdf" ? "pdf" : "image",
    });

    const rawWords = await analyzeImageLocal(imagePart, prompt);

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
