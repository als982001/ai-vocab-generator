import type { IWord, Language, WordLevel } from "~/types";
import { LANGUAGE_CONFIG } from "~/utils/language";

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
 * AI 응답 단어 목록의 등급을 정규화하고 중복 단어를 제거
 * (영어는 대소문자를 무시하고 비교, 먼저 나온 항목을 유지)
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
  if (!Array.isArray(rawWords)) {
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }

  const seenKeys = new Set<string>();
  const words: IWord[] = [];

  (rawWords as IWord[]).forEach((rawWord) => {
    if (typeof rawWord?.word !== "string") return;

    // 공백 변형("apple ")이 중복 제거를 빠져나가지 않도록 trim 후 비교
    const trimmedWord = rawWord.word.trim();

    if (!trimmedWord) return;

    const dedupeKey =
      language === "en" ? trimmedWord.toLowerCase() : trimmedWord;

    if (seenKeys.has(dedupeKey)) return;

    seenKeys.add(dedupeKey);

    const { level } = normalizeLevel({ language, rawLevel: rawWord.level });

    // AI가 필드를 빠뜨려도 저장·검색(toLowerCase)이 깨지지 않도록 문자열 보장
    words.push({
      ...rawWord,
      word: trimmedWord,
      reading: typeof rawWord.reading === "string" ? rawWord.reading : "",
      meaning: typeof rawWord.meaning === "string" ? rawWord.meaning : "",
      part_of_speech:
        typeof rawWord.part_of_speech === "string"
          ? rawWord.part_of_speech
          : undefined,
      level,
    });
  });

  return { words };
}
