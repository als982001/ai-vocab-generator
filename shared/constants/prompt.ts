// api/analyze.js(서버)와 app(클라이언트)이 함께 쓰는 지원 언어 목록
export const SUPPORTED_LANGUAGES = ["ja", "en"] as const;

const JAPANESE_FIELDS = `
- word: The Japanese word (Kanji or Kana)
- reading: Furigana reading in Hiragana/Katakana
- meaning: Meaning in Korean (한국어 뜻)
- level: Estimated JLPT level (e.g., N5, N4, N3, N2, N1)`;

const ENGLISH_FIELDS = `
- word: The English word or fixed phrase in its base (dictionary) form, lowercase unless it is a proper noun
- reading: IPA pronunciation (e.g., /ˈæp.əl/)
- meaning: Meaning in Korean (한국어 뜻)
- part_of_speech: One of noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, phrase
- level: Estimated CEFR level, exactly one of A1, A2, B1, B2, C1, C2`;

const IMAGE_EXAMPLES = {
  ja: `[{"word": "猫", "reading": "ねこ", "meaning": "고양이", "level": "N5", "box_2d": [150, 200, 300, 400]}]`,
  en: `[{"word": "cat", "reading": "/kæt/", "meaning": "고양이", "part_of_speech": "noun", "level": "A1", "box_2d": [150, 200, 300, 400]}]`,
};

const DOCUMENT_EXAMPLES = {
  ja: `[{"word": "猫", "reading": "ねこ", "meaning": "고양이", "level": "N5", "page": 1, "box_2d": [150, 200, 300, 400]}]`,
  en: `[{"word": "cat", "reading": "/kæt/", "meaning": "고양이", "part_of_speech": "noun", "level": "A1", "page": 1, "box_2d": [150, 200, 300, 400]}]`,
};

/**
 * 언어와 파일 종류에 맞는 Gemini 분석 프롬프트를 생성
 * @param language 추출할 언어 ("ja" | "en")
 * @param fileType 업로드 파일 종류 ("image" | "pdf")
 * @return prompt Gemini에 전달할 프롬프트 문자열
 */
export function buildAnalyzePrompt({
  language,
  fileType,
}: {
  language: (typeof SUPPORTED_LANGUAGES)[number];
  fileType: "image" | "pdf";
}): { prompt: string } {
  const languageName = language === "en" ? "English" : "Japanese";
  const fields = language === "en" ? ENGLISH_FIELDS : JAPANESE_FIELDS;
  const duplicateRule =
    language === "en"
      ? "\nDo not include duplicate words. Merge inflected forms into one base form.\n"
      : "";

  if (fileType === "pdf") {
    return {
      prompt: `
Analyze this document (image or PDF) and extract ${languageName} vocabulary.
Return the result as a STRICT JSON array without markdown code blocks.
${duplicateRule}
Each item should have:${fields}
- page: The page number where this word appears (Integer, 1-indexed. If it's a single image, return 1).
- box_2d: The exact bounding box of where this word appears on that specific page.
  Format: [y_min, x_min, y_max, x_max] as normalized coordinates from 0 to 1000,
  where (0,0) is top-left corner and (1000,1000) is bottom-right corner of the page.

Example format:
${DOCUMENT_EXAMPLES[language]}
`,
    };
  }

  return {
    prompt: `
Analyze this image and extract ${languageName} vocabulary.
Return the result as a STRICT JSON array without markdown code blocks.
${duplicateRule}
Each item should have:${fields}
- box_2d: The exact bounding box of where this word appears in the image.
  Format: [y_min, x_min, y_max, x_max] as normalized coordinates from 0 to 1000,
  where (0,0) is top-left corner and (1000,1000) is bottom-right corner.

Example format:
${IMAGE_EXAMPLES[language]}
`,
  };
}

export const GEMINI_2_DOT_5_FLASH = "gemini-2.5-flash";
export const GEMINI_3_FLASH_PREVIEW = "gemini-3-flash-preview";
