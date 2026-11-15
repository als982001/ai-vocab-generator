// api/analyze.js(서버)와 app(클라이언트)이 함께 쓰는 Gemini 응답 스키마.
// 서버가 Node ESM으로 직접 import하므로 런타임 import 없이 이 파일만으로 완결한다 (type import는 지워져서 괜찮다)
import type { SUPPORTED_LANGUAGES } from "./prompt";

export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
  "phrase",
] as const;

export const BOX_COORDINATE_MIN = 0;

export const BOX_COORDINATE_MAX = 1000;

/**
 * 언어와 파일 종류에 맞는 Gemini 응답 JSON Schema(responseJsonSchema)를 생성
 * 모델 출력을 좁히는 용도라 엄격하게 둔다. 런타임 검증은 app/utils/word.ts가 따로 느슨하게 한다.
 * @param language 추출할 언어 ("ja" | "en")
 * @param fileType 업로드 파일 종류 ("image" | "pdf")
 * @return schema 단어 배열 JSON Schema
 */
export function buildWordResponseSchema({
  language,
  fileType,
}: {
  language: (typeof SUPPORTED_LANGUAGES)[number];
  fileType: "image" | "pdf";
}): { schema: Record<string, unknown> } {
  const isEnglish = language === "en";

  const properties: Record<string, unknown> = {
    word: { type: "string" },
    reading: { type: "string" },
    meaning: { type: "string" },
    level: {
      type: "string",
      enum: isEnglish ? [...CEFR_LEVELS] : [...JLPT_LEVELS],
    },
    box_2d: {
      type: "array",
      items: {
        type: "integer",
        minimum: BOX_COORDINATE_MIN,
        maximum: BOX_COORDINATE_MAX,
      },
      minItems: 4,
      maxItems: 4,
    },
  };

  if (isEnglish) {
    properties.part_of_speech = { type: "string", enum: [...PARTS_OF_SPEECH] };
  }

  if (fileType === "pdf") {
    properties.page = { type: "integer", minimum: 1 };
  }

  return {
    schema: {
      type: "array",
      items: {
        type: "object",
        properties,
        required: Object.keys(properties),
        additionalProperties: false,
      },
    },
  };
}
