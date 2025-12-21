// api/analyze.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
  // CORS 설정 (다른 곳에서 내 API 못 쓰게 막음)
  response.setHeader("Access-Control-Allow-Credentials", true);
  response.setHeader("Access-Control-Allow-Origin", "*");

  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { imageBase64 } = request.body; // 프론트에서 받은 이미지

    // 서버 환경변수는 VITE_ 안 붙여도 됨 (보안 안전)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze this image and extract Japanese vocabulary.
      Return the result as a STRICT JSON array without markdown code blocks.
      Each item should have:
      - word: The Japanese word (Kanji or Kana)
      - reading: Furigana reading in Hiragana/Katakana
      - meaning: Meaning in Korean (한국어 뜻)
      - level: Estimated JLPT level (e.g., N5, N4, N3, N2, N1)
      
      Example format:
      [{"word": "猫", "reading": "ねこ", "meaning": "고양이", "level": "N5"}]
    `;

    // 이미지 객체 생성
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg", // 혹은 png 등 유동적으로
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
