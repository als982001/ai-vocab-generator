import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. API 키 불러오기
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// 2. 이미지를 AI가 이해할 수 있는 포맷(Base64)으로 변환하는 헬퍼 함수
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

// 3. 실제 AI 호출 함수
export const analyzeImage = async (file: File) => {
  try {
    // Gemini 1.5 Flash 모델 선택 (빠르고 저렴함)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 프롬프트 (명령어)
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

    const imagePart = await fileToGenerativePart(file);

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
