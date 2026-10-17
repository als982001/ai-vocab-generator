import { useState } from "react";

import type { Language, WordLevel } from "~/types";
import { DEFAULT_LANGUAGE } from "~/utils/language";

/**
 * 단어 필터링 기능을 관리하는 커스텀 훅
 * - 필터 패널 열기/닫기
 * - 언어 필터링 (단일 선택, 기본 일본어)
 * - 연도별 필터링 (단일 선택)
 * - 등급별 필터링 (다중 선택, 등급 체계는 언어별)
 */
export function useWordFilter() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<Language>(DEFAULT_LANGUAGE);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<WordLevel[]>([]);

  /** 필터 패널 토글 */
  const toggleFilter = () => {
    setIsFilterOpen((prev) => !prev);
  };

  /** 연도 필터 토글 (같은 연도 클릭 시 해제) */
  const handleYearClick = (year: number) => {
    setSelectedYear(selectedYear === year ? null : year);
  };

  /** 언어 변경 - 언어마다 등급 체계와 연도 목록이 달라 등급·연도 선택 초기화 */
  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    setSelectedYear(null);
    setSelectedLevels([]);
  };

  /** 등급 필터 토글 (다중 선택 가능) */
  const handleLevelClick = (level: WordLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  /** 연도·등급 필터 초기화 (언어는 보기 기준이라 유지) */
  const resetFilters = () => {
    setSelectedYear(null);
    setSelectedLevels([]);
  };

  return {
    isFilterOpen,
    selectedLanguage,
    selectedYear,
    selectedLevels,
    toggleFilter,
    handleLanguageChange,
    handleYearClick,
    handleLevelClick,
    resetFilters,
  };
}
