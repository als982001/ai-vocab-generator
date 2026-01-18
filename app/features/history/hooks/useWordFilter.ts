import { useState } from "react";

import type { JlptLevel } from "~/types";

/**
 * 단어 필터링 기능을 관리하는 커스텀 훅
 * - 필터 패널 열기/닫기
 * - 연도별 필터링 (단일 선택)
 * - JLPT 레벨별 필터링 (다중 선택)
 */
export function useWordFilter() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<JlptLevel[]>([]);

  /** 필터 패널 토글 */
  const toggleFilter = () => {
    setIsFilterOpen((prev) => !prev);
  };

  /** 연도 필터 토글 (같은 연도 클릭 시 해제) */
  const handleYearClick = (year: number) => {
    setSelectedYear(selectedYear === year ? null : year);
  };

  /** JLPT 레벨 필터 토글 (다중 선택 가능) */
  const handleLevelClick = (level: JlptLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  /** 모든 필터 초기화 */
  const resetFilters = () => {
    setSelectedYear(null);
    setSelectedLevels([]);
  };

  return {
    isFilterOpen,
    selectedYear,
    selectedLevels,
    toggleFilter,
    handleYearClick,
    handleLevelClick,
    resetFilters,
  };
}
