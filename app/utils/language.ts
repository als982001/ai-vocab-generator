import type {
  IDisplayOptions,
  ILanguageConfig,
  Language,
  WordLevel,
} from "~/types";

export const DEFAULT_LANGUAGE: Language = "ja";

export const LANGUAGE_CONFIG: Record<Language, ILanguageConfig> = {
  ja: {
    label: "일본어",
    levelTitle: "JLPT Level",
    levels: ["N5", "N4", "N3", "N2", "N1"],
    ttsLocale: "ja-JP",
    fontClassName: "font-japanese",
    displayOptions: [{ key: "showFurigana", label: "Show Furigana" }],
  },
  en: {
    label: "영어",
    levelTitle: "CEFR Level (AI 추정)",
    levelTooltip: "AI가 추정한 등급",
    levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    ttsLocale: "en-US",
    fontClassName: "",
    displayOptions: [
      { key: "showIpa", label: "Show IPA" },
      { key: "showPartOfSpeech", label: "Show Part of Speech" },
    ],
  },
};

export const LANGUAGES = Object.keys(LANGUAGE_CONFIG) as Language[];

export const DEFAULT_DISPLAY_OPTIONS: IDisplayOptions = {
  showFurigana: true,
  showIpa: true,
  showPartOfSpeech: true,
};

/**
 * 언어별 등급 목록에서 쉬운 순 순위를 계산
 * @param language 단어의 언어
 * @param level 단어의 등급 (등급 미정이면 null)
 * @return rank 0부터 시작하는 순위, 목록에 없거나 null이면 null
 */
export function getLevelRank({
  language,
  level,
}: {
  language: Language;
  level: WordLevel | null;
}): { rank: number | null } {
  if (!level) return { rank: null };

  const index = LANGUAGE_CONFIG[language].levels.indexOf(level);

  return { rank: index === -1 ? null : index };
}

/**
 * 언어와 표시 옵션으로 카드에 보여줄 항목을 결정
 * @param language 단어의 언어
 * @param displayOptions 사용자가 고른 표시 옵션
 * @return showReading 읽기(후리가나/IPA) 노출 여부, showPartOfSpeech 품사 노출 여부
 */
export function getWordVisibility({
  language,
  displayOptions,
}: {
  language: Language;
  displayOptions: IDisplayOptions;
}): { showReading: boolean; showPartOfSpeech: boolean } {
  // 영어
  if (language === "en") {
    return {
      showReading: displayOptions.showIpa,
      showPartOfSpeech: displayOptions.showPartOfSpeech,
    };
  }

  // 일본어
  return { showReading: displayOptions.showFurigana, showPartOfSpeech: false };
}
