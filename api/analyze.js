// api/analyze.js
import { GoogleGenerativeAI } from "@google/generative-ai";

import {
  ANALYZE_DOCUMENT_PROMPT,
  ANALYZE_IMAGE_PROMPT,
  GEMINI_3_FLASH_PREVIEW,
} from "../shared/constants/prompt.js";

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
    const { imageBase64, mimeType } = request.body; // 프론트에서 받은 이미지

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

    // 서버 환경변수는 VITE_ 안 붙여도 됨 (보안 안전)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_3_FLASH_PREVIEW });

    const prompt =
      mimeType === "application/pdf"
        ? ANALYZE_DOCUMENT_PROMPT
        : ANALYZE_IMAGE_PROMPT;

    // 이미지 객체 생성
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return response.status(200).json(JSON.parse(cleanJson));
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
