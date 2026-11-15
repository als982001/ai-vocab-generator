// api/analyze.js
import { GoogleGenAI } from "@google/genai";

import {
  GEMINI_3_FLASH_PREVIEW,
  SUPPORTED_LANGUAGES,
  buildAnalyzePrompt,
} from "../shared/constants/prompt.js";
import { buildWordResponseSchema } from "../shared/constants/wordSchema.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export default async function handler(request, response) {
  // CORS 설정 — 현재 모든 도메인 허용 상태
  // TODO: 보안을 위해 ALLOWED_ORIGIN 환경변수 기반으로 허용 도메인을 제한하는 것이 필요한지 확인 후 수정
  response.setHeader("Access-Control-Allow-Credentials", true);
  response.setHeader("Access-Control-Allow-Origin", "*");

  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // language가 없으면 일본어로 처리 (언어 선택 이전 버전 클라이언트 호환)
    const { imageBase64, mimeType, language = "ja" } = request.body; // 프론트에서 받은 이미지

    if (!imageBase64 || !mimeType) {
      return response
        .status(400)
        .json({ error: "imageBase64와 mimeType은 필수입니다." });
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return response
        .status(400)
        .json({ error: "지원하지 않는 파일 형식입니다." });
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return response.status(400).json({ error: "지원하지 않는 언어입니다." });
    }

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

    const result = await ai.models.generateContent({
      model: GEMINI_3_FLASH_PREVIEW,
      contents: [prompt, imagePart],
      // 응답 형식을 API 설정으로 강제 (JSON 문법만 보장, 값 검증은 클라이언트 normalizeWords가 담당)
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: schema,
      },
    });

    // 텍스트가 없으면(차단 등) 빈 문자열 → JSON.parse 실패 → 500
    return response.status(200).json(JSON.parse(result.text ?? ""));
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
