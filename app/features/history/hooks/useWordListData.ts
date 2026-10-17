import { useMemo } from "react";

import type { IWordWithDate, SortOption } from "~/features/history/types";
import type { Language, WordLevel } from "~/types";
import type { IAnalysisRow, IWordRow } from "~/types/supabase";
import { formatRelativeTime } from "~/utils/date";
import { getLevelRank } from "~/utils/language";

interface IUseWordListDataParams {
  historyData: (IAnalysisRow & { words: IWordRow[] })[] | undefined;
  sortBy: SortOption;
  selectedLanguage: Language;
  selectedYear: number | null;
  selectedLevels: WordLevel[];
  searchQuery: string;
}

// 등급 순 정렬 비교 (등급 미정 단어는 항상 맨 뒤)
function compareByLevel(
  a: IWordWithDate,
  b: IWordWithDate,
  direction: "easy" | "hard"
): number {
  const { rank: rankA } = getLevelRank({
    language: a.language,
    level: a.level,
  });
  const { rank: rankB } = getLevelRank({
    language: b.language,
    level: b.level,
  });

  if (rankA === null && rankB === null) return 0;

  if (rankA === null) return 1;

  if (rankB === null) return -1;

  return direction === "easy" ? rankA - rankB : rankB - rankA;
}

export function useWordListData({
  historyData,
  sortBy,
  selectedLanguage,
  selectedYear,
  selectedLevels,
  searchQuery,
}: IUseWordListDataParams) {
  // 쿼리 데이터를 IWordWithDate[] 형태로 변환
  const allWords = useMemo<IWordWithDate[]>(() => {
    if (!historyData) return [];

    return historyData.flatMap((analysis) =>
      analysis.words.map((word) => ({
        ...word,
        level: word.level,
        part_of_speech: word.part_of_speech ?? undefined,
        box_2d: word.box_2d ?? undefined,
        language: analysis.language,
        date: formatRelativeTime(analysis.created_at),
        createdAt: analysis.created_at,
        analysisId: analysis.id,
      }))
    );
  }, [historyData]);

  // 선택한 언어의 단어만 (언어 필터는 "전체" 없이 단일 선택)
  const languageWords = useMemo(
    () => allWords.filter((word) => word.language === selectedLanguage),
    [allWords, selectedLanguage]
  );

  // 정렬된 단어 목록
  const sortedWords = useMemo(() => {
    const words = [...languageWords];

    switch (sortBy) {
      case "oldest":
        return words.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "level-easy":
        return words.sort((a, b) => compareByLevel(a, b, "easy"));
      case "level-hard":
        return words.sort((a, b) => compareByLevel(a, b, "hard"));
      case "newest":
      default:
        return words.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [languageWords, sortBy]);

  // 필터링된 단어 목록
  const filteredWords = useMemo(() => {
    let words = [...sortedWords];

    // 연도 필터
    if (selectedYear !== null) {
      words = words.filter((word) => {
        const year = new Date(word.createdAt).getFullYear();

        return year === selectedYear;
      });
    }

    // 레벨 필터 (다중 선택)
    if (selectedLevels.length > 0) {
      words = words.filter(
        (word) => word.level !== null && selectedLevels.includes(word.level)
      );
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      words = words.filter(
        (word) =>
          word.word.toLowerCase().includes(query) ||
          word.meaning.toLowerCase().includes(query) ||
          word.reading.toLowerCase().includes(query)
      );
    }

    return words;
  }, [sortedWords, selectedYear, selectedLevels, searchQuery]);

  const availableYears = useMemo(() => {
    const years = new Set(
      languageWords.map((word) => new Date(word.createdAt).getFullYear())
    );

    return [...years].sort((a, b) => b - a);
  }, [languageWords]);

  // 선택한 언어로 저장된 단어가 하나라도 있는지 (필터·검색 적용 전 기준)
  const hasLanguageWords = languageWords.length > 0;

  return { allWords, filteredWords, availableYears, hasLanguageWords };
}
