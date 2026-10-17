import { useState } from "react";

import { motion } from "framer-motion";
import { FileSearch, History, Search, SlidersHorizontal } from "lucide-react";
import { AnimatedViewportItem } from "~/components/motion/AnimatedList";
import { DownloadDropdown } from "~/components/shared/DownloadDropdown";
import { FloatingActionButton } from "~/components/shared/FloatingActionButton";
import { MobileHeader } from "~/components/shared/MobileHeader";
import { Sidebar } from "~/components/shared/Sidebar";
import { SidebarDrawer } from "~/components/shared/SidebarDrawer";
import {
  downloadWordsAsCsv,
  downloadWordsAsTxt,
} from "~/features/dashboard/utils/download";
import { DesktopWordCard } from "~/features/history/components/DesktopWordCard";
import { FilterDropdown } from "~/features/history/components/FilterDropdown";
import { MobileFilterSheet } from "~/features/history/components/MobileFilterSheet";
import { MobileWordCard } from "~/features/history/components/MobileWordCard";
import { getSortOptions } from "~/features/history/constants/sort";
import { useAnalysisHistory } from "~/features/history/hooks/useAnalysisHistory";
import { useSearch } from "~/features/history/hooks/useSearch";
import { useWordActions } from "~/features/history/hooks/useWordActions";
import { useWordEdit } from "~/features/history/hooks/useWordEdit";
import { useWordFilter } from "~/features/history/hooks/useWordFilter";
import { useWordListData } from "~/features/history/hooks/useWordListData";
import type { SortOption } from "~/features/history/types";
import type { IDisplayOptions } from "~/types";
import { PAGE_TRANSITION, PAGE_TRANSITION_DURATION } from "~/utils/animation";
import { DEFAULT_DISPLAY_OPTIONS, LANGUAGE_CONFIG } from "~/utils/language";

export default function HistoryPage() {
  const [displayOptions, setDisplayOptions] = useState<IDisplayOptions>(
    DEFAULT_DISPLAY_OPTIONS
  );
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { searchInput, searchQuery, setSearchInput, handleSearchKeyDown } =
    useSearch();

  // 필터 패널 상태 및 핸들러
  const {
    isFilterOpen,
    selectedLanguage,
    selectedYear,
    selectedLevels,
    toggleFilter,
    handleLanguageChange,
    handleYearClick,
    handleLevelClick,
    resetFilters,
  } = useWordFilter();

  // 단어 편집 모드 상태 및 핸들러
  const {
    editingWord,
    editedMeaning,
    editedLevel,
    setEditedMeaning,
    setEditedLevel,
    startEdit,
    cancelEdit,
    clearEditingWord,
    checkIsEditing,
  } = useWordEdit();

  // Supabase에서 히스토리 조회
  const { data: historyData } = useAnalysisHistory();

  const { allWords, filteredWords, availableYears, hasLanguageWords } =
    useWordListData({
      historyData,
      sortBy,
      selectedLanguage,
      selectedYear,
      selectedLevels,
      searchQuery,
    });

  const { sortOptions } = getSortOptions({ language: selectedLanguage });

  const { handleDeleteWord, handleSaveEdit } = useWordActions(allWords);

  const handleDownloadTxt = () => {
    downloadWordsAsTxt({ words: filteredWords, language: selectedLanguage });
  };

  const handleDownloadCsv = () => {
    downloadWordsAsCsv({ words: filteredWords, language: selectedLanguage });
  };

  return (
    <div className="bg-background-dark text-text-primary font-display h-screen w-full overflow-hidden flex flex-col">
      <MobileHeader
        title="History"
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        language={selectedLanguage}
        selectedLevels={selectedLevels}
        onLevelToggle={handleLevelClick}
        showLevelOptions={false}
        displayOptions={displayOptions}
        onDisplayOptionsChange={setDisplayOptions}
      />

      <MobileFilterSheet
        isOpen={isFilterOpen}
        onClose={toggleFilter}
        sortOptions={sortOptions}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        availableYears={availableYears}
        selectedYear={selectedYear}
        onYearChange={handleYearClick}
        selectedLevels={selectedLevels}
        onLevelChange={handleLevelClick}
        onReset={resetFilters}
      />

      <div className="flex flex-1 h-full w-full overflow-hidden">
        <Sidebar
          language={selectedLanguage}
          showLevelOptions={false}
          selectedLevels={selectedLevels}
          onLevelToggle={handleLevelClick}
          displayOptions={displayOptions}
          onDisplayOptionsChange={setDisplayOptions}
          className="hidden md:flex"
        />

        {/* Main Content */}
        <motion.main
          className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#fafafa]"
          variants={PAGE_TRANSITION}
          initial="initial"
          animate="animate"
          transition={{ duration: PAGE_TRANSITION_DURATION }}
        >
          {/* Mobile Search Bar */}
          <div className="md:hidden px-4 py-3 bg-white">
            <label className="relative flex items-center w-full">
              <Search className="absolute left-4 w-5 h-5 text-text-secondary" />
              <input
                className="w-full h-12 pl-12 pr-4 bg-gray-100 border-none rounded-full text-base focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-secondary"
                placeholder="Search vocabulary..."
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </label>
          </div>

          {/* Mobile Filter Bar */}
          <div className="md:hidden px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-2">
            {/* Selected Filters */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {/* Language */}
              <span className="shrink-0 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                {LANGUAGE_CONFIG[selectedLanguage].label}
              </span>
              {/* Sort Option */}
              <span className="shrink-0 px-3 py-1 bg-gray-200 text-text-primary text-xs font-medium rounded-full">
                {sortOptions.find((opt) => opt.value === sortBy)?.label}
              </span>
              {selectedYear && (
                <span className="shrink-0 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                  {selectedYear}
                </span>
              )}
              {selectedLevels.map((level) => (
                <span
                  key={level}
                  className="shrink-0 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full"
                >
                  {level}
                </span>
              ))}
            </div>

            {/* Filter Button */}
            <button
              onClick={toggleFilter}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">
                필터
              </span>
            </button>
          </div>

          {/* Header - Desktop only */}
          <header className="hidden md:flex h-16 bg-white shadow-sm sticky top-0 z-30 px-8 items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <History className="w-4 h-4" />
              <span>/</span>
              <span className="text-text-primary font-medium">History</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
                <input
                  className="pl-10 pr-4 py-2 w-64 text-sm bg-white border border-border-color rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-text-secondary"
                  placeholder="Search vocabulary..."
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
              {/* Download Dropdown */}
              <DownloadDropdown
                wordCount={filteredWords.length}
                onDownloadTxt={handleDownloadTxt}
                onDownloadCsv={handleDownloadCsv}
                disabled={filteredWords.length === 0}
                direction="down"
                compact
              />
            </div>
          </header>

          {/* Content Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-[1200px] mx-auto">
              {/* Stats / Summary */}
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
                <p className="hidden md:block text-sm text-text-secondary">
                  Showing {filteredWords.length} vocabulary cards
                </p>
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Sort by:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="text-sm bg-transparent border-none p-0 pr-6 focus:ring-0 font-medium cursor-pointer text-text-primary outline-none"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filters Dropdown */}
                  <FilterDropdown
                    isFilterOpen={isFilterOpen}
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={handleLanguageChange}
                    availableYears={availableYears}
                    selectedYear={selectedYear}
                    selectedLevels={selectedLevels}
                    onYearChange={handleYearClick}
                    onLevelChange={handleLevelClick}
                    onReset={resetFilters}
                    onToggle={toggleFilter}
                  />
                </div>
              </div>

              {/* 선택한 언어의 저장 단어가 없을 때 안내 (조회 완료 후에만) */}
              {historyData && !hasLanguageWords && (
                <div className="flex flex-col items-center justify-center gap-4 text-center py-24">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <FileSearch className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-text-primary font-medium mb-1">
                      저장된 {LANGUAGE_CONFIG[selectedLanguage].label} 단어가
                      없습니다
                    </p>
                    <p className="text-text-secondary text-sm">
                      필터에서 다른 언어를 선택해보세요
                    </p>
                  </div>
                </div>
              )}

              {/* Desktop Card Grid */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWords.map((word, index) => {
                  const isEditing = checkIsEditing(word);

                  return (
                    <AnimatedViewportItem key={index}>
                      <DesktopWordCard
                        word={word}
                        isEditing={isEditing}
                        editedMeaning={editedMeaning}
                        editedLevel={editedLevel}
                        onEditedMeaningChange={setEditedMeaning}
                        onEditedLevelChange={setEditedLevel}
                        onSaveEdit={() =>
                          handleSaveEdit(
                            editingWord,
                            editedMeaning,
                            editedLevel,
                            clearEditingWord
                          )
                        }
                        onCancelEdit={cancelEdit}
                        onStartEdit={startEdit}
                        onDeleteWord={handleDeleteWord}
                        displayOptions={displayOptions}
                      />
                    </AnimatedViewportItem>
                  );
                })}
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden flex flex-col gap-4">
                {filteredWords.map((word, index) => (
                  <AnimatedViewportItem key={index}>
                    <MobileWordCard word={word} />
                  </AnimatedViewportItem>
                ))}
              </div>
            </div>
          </div>

          <FloatingActionButton
            onDownloadTxt={handleDownloadTxt}
            onDownloadCsv={handleDownloadCsv}
            wordCount={filteredWords.length}
          />
        </motion.main>
      </div>
    </div>
  );
}
