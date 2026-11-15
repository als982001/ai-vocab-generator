import { z } from "zod";
import type { IWord, Language, WordLevel } from "~/types";
import { LANGUAGE_CONFIG } from "~/utils/language";

import {
  BOX_COORDINATE_MAX,
  BOX_COORDINATE_MIN,
} from "../../shared/constants/wordSchema";

// 응답 전체는 배열이어야 한다. 아니면 결과 전체를 거부한다
const rawWordListSchema = z.array(z.unknown());

// box_2d: 숫자 4개일 때만 인정. 범위 밖 값은 0~1000으로 자르고,
// 자른 뒤에도 min < max가 아니면(뒤집힘·넓이 0) 좌표만 버린다
const boxSchema = z
  .array(z.number())
  .length(4)
  .transform((box) => {
    return box.map((value) => {
      return Math.min(Math.max(value, BOX_COORDINATE_MIN), BOX_COORDINATE_MAX);
    });
  })
  .refine(([ymin, xmin, ymax, xmax]) => {
    return ymin < ymax && xmin < xmax;
  });

// 항목 검증. word가 없거나 비면 항목을 버리고, 나머지 필드는 .catch로 보정한다
// (모델 스키마는 엄격, 런타임은 느슨: 기존 보정 정책을 거부로 바꾸지 않기 위함)
// z.object는 정의 밖 필드를 버린다
const rawWordSchema = z.object({
  word: z.string().trim().min(1),
  reading: z.string().catch(""),
  meaning: z.string().catch(""),
  // normalizeLevel이 목록 밖 값을 null(등급 미정)로 맞춘다.
  // Zod 4의 z.unknown()은 object 안에서 키 누락을 거부하므로 optional 필수 (빠지면 항목째 사라짐)
  level: z.unknown().optional(),
  part_of_speech: z.string().optional().catch(undefined),
  box_2d: boxSchema.optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
});

/**
 * AI가 준 등급 문자열을 언어별 등급 목록의 값으로 맞춤
 * (예: "b2+" → "B2", 끝까지 안 맞으면 null = 등급 미정)
 * @param language 단어의 언어
 * @param rawLevel AI 응답의 level 값
 * @return level 정규화된 등급 또는 null
 */
export function normalizeLevel({
  language,
  rawLevel,
}: {
  language: Language;
  rawLevel: unknown;
}): { level: WordLevel | null } {
  if (typeof rawLevel !== "string") return { level: null };

  const { levels } = LANGUAGE_CONFIG[language];
  const upperLevel = rawLevel.trim().toUpperCase();

  const matchedLevel =
    levels.find((level) => level === upperLevel) ??
    levels.find((level) => level === upperLevel.slice(0, 2));

  return { level: matchedLevel ?? null };
}

/**
 * AI 응답을 검증·보정하고 등급 정규화와 중복 제거를 거쳐 단어 목록으로 만듦
 * - 거부(throw): 응답이 배열이 아님
 * - 항목 제외: 객체가 아님, word가 문자열이 아니거나 trim 후 빔, 중복(영어는 대소문자 무시, 먼저 나온 항목 유지)
 * - 보정 (값이 잘못돼도 단어는 남김)
 *   - reading·meaning: 문자열이 아니거나 누락이면 ""
 *   - part_of_speech: 문자열이 아니면 undefined
 *   - level: "b2+" → "B2"처럼 맞추고, 목록 밖이거나 누락이면 null(등급 미정)
 *   - box_2d: 숫자 4개가 아니면 제거. 0~1000 밖 값은 범위 안으로 자르고,
 *     자른 뒤 ymin < ymax && xmin < xmax가 아니면(뒤집힘·넓이 0) 제거
 *   - page: 1 이상 정수가 아니면 제거
 *   - 정의 밖 필드: 제거
 * @param rawWords AI 응답을 JSON.parse한 값
 * @param language 추출 언어
 * @return words 화면과 저장에 쓸 단어 목록
 */
export function normalizeWords({
  rawWords,
  language,
}: {
  rawWords: unknown;
  language: Language;
}): { words: IWord[] } {
  const parsedList = rawWordListSchema.safeParse(rawWords);

  if (!parsedList.success) {
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }

  const seenKeys = new Set<string>();
  const words: IWord[] = [];

  parsedList.data.forEach((rawWord) => {
    const parsedWord = rawWordSchema.safeParse(rawWord);

    if (!parsedWord.success) return;

    // word는 스키마에서 trim됨 → 공백 변형("apple ")도 같은 키로 비교된다
    const { word, level: rawLevel, ...fields } = parsedWord.data;

    const dedupeKey = language === "en" ? word.toLowerCase() : word;

    if (seenKeys.has(dedupeKey)) return;

    seenKeys.add(dedupeKey);

    const { level } = normalizeLevel({ language, rawLevel });

    words.push({ ...fields, word, level });
  });

  return { words };
}
