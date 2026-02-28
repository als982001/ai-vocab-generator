import { useMemo } from "react";

import type { SortOption } from "~/features/history/types";
import type { JlptLevel } from "~/types";
import { formatRelativeTime } from "~/utils/date";
import { levelToNumber } from "~/utils/jlpt";

interface IAnalysisData {
  id: string;
  created_at: string;
  words: {
    id: string;
    word: string;
    reading: string;
    meaning: string;
    level: string;
    box_2d?: number[] | null;
  }[];
}

interface IUseWordListDataParams {
  historyData: IAnalysisData[] | undefined;
  sortBy: SortOption;
  selectedYear: number | null;
  selectedLevels: JlptLevel[];
  searchQuery: string;
}

export function useWordListData({
  historyData,
  sortBy,
  selectedYear,
  selectedLevels,
  searchQuery,
}: IUseWordListDataParams) {
  // 쿼리 데이터를 IWordWithDate[] 형태로 변환
  const allWords = useMemo(() => {
    if (!historyData) return [];

    return historyData.flatMap((analysis) =>
      analysis.words.map((word) => ({
        ...word,
        level: word.level as JlptLevel,
        box_2d: word.box_2d ?? undefined,
        date: formatRelativeTime(analysis.created_at),
        createdAt: analysis.created_at,
        analysisId: analysis.id,
      }))
    );
  }, [historyData]);

  // 정렬된 단어 목록
  const sortedWords = useMemo(() => {
    const words = [...allWords];

    switch (sortBy) {
      case "oldest":
        return words.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "level-easy":
        return words.sort(
          (a, b) => levelToNumber(b.level) - levelToNumber(a.level)
        );
      case "level-hard":
        return words.sort(
          (a, b) => levelToNumber(a.level) - levelToNumber(b.level)
        );
      case "newest":
      default:
        return words.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [allWords, sortBy]);

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
      words = words.filter((word) => selectedLevels.includes(word.level));
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

  return { allWords, filteredWords };
}
