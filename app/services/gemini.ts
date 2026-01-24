import { GoogleGenerativeAI } from "@google/generative-ai";

import { ANALYZE_IMAGE_PROMPT } from "../../shared/constants/prompt";

const analyzeImageLocal = async (imagePart: {
  inlineData: {
    data: string;
    mimeType: string;
  };
}) => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  try {
    // Gemini 1.5 Flash 모델 선택 (빠르고 저렴함)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 프롬프트 (명령어)
    const prompt = ANALYZE_IMAGE_PROMPT;

    // AI에게 요청 전송
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // 혹시라도 마크다운(```json ... ```)이 섞여올 경우를 대비해 제거
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Analysis Failed:", error);
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

// 실제 AI 호출 함수
export const analyzeImage = async (file: File) => {
  // 1. 파일을 Base64로 변환 (기존 함수 활용)
  const imagePart = await fileToGenerativePart(file);
  const base64Data = imagePart.inlineData.data;

  // 2. 내 Vercel 서버로 요청 (API 키 필요 없음!)
  // 로컬 환경 체크
  const isLocal = window.location.hostname === "localhost";

  if (isLocal) {
    const result = await analyzeImageLocal(imagePart);
    return result;
  }

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64Data }),
  });

  if (!response.ok) throw new Error("분석 실패");

  return await response.json();
};
