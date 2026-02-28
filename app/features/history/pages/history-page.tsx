import { useState } from "react";

import { motion } from "framer-motion";
import { History, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
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
import { SORT_OPTIONS } from "~/features/history/constants/sort";
import { useAnalysisHistory } from "~/features/history/hooks/useAnalysisHistory";
import { useSearch } from "~/features/history/hooks/useSearch";
import { useWordEdit } from "~/features/history/hooks/useWordEdit";
import { useWordFilter } from "~/features/history/hooks/useWordFilter";
import { useWordListData } from "~/features/history/hooks/useWordListData";
import {
  useDeleteWord,
  useRestoreWord,
  useUpdateWord,
} from "~/features/history/hooks/useWordMutations";
import type { IWordWithDate, SortOption } from "~/features/history/types";
import type { IDisplayOptions } from "~/types";
import { PAGE_TRANSITION, PAGE_TRANSITION_DURATION } from "~/utils/animation";

export default function HistoryPage() {
  const [displayOptions, setDisplayOptions] = useState<IDisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { searchInput, searchQuery, setSearchInput, handleSearchKeyDown } =
    useSearch();

  // 필터 패널 상태 및 핸들러
  const {
    isFilterOpen,
    selectedYear,
    selectedLevels,
    toggleFilter,
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

  const { allWords, filteredWords } = useWordListData({
    historyData,
    sortBy,
    selectedYear,
    selectedLevels,
    searchQuery,
  });

  const deleteWordMutation = useDeleteWord();
  const updateWordMutation = useUpdateWord();
  const restoreWordMutation = useRestoreWord();

  const handleDeleteWord = (targetWord: IWordWithDate) => {
    if (deleteWordMutation.isPending) return;

    if (confirm("정말 이 단어를 삭제하시겠습니까?")) {
      deleteWordMutation.mutate(targetWord.id, {
        onSuccess: () => {
          toast.success("단어가 삭제되었습니다.", {
            action: {
              label: "취소",
              onClick: () => {
                restoreWordMutation.mutate(
                  {
                    analysisId: targetWord.analysisId,
                    word: {
                      word: targetWord.word,
                      reading: targetWord.reading,
                      meaning: targetWord.meaning,
                      level: targetWord.level,
                      box_2d: targetWord.box_2d,
                    },
                  },
                  {
                    onSuccess: () => toast.success("삭제가 취소되었습니다."),
                  }
                );
              },
            },
          });
        },
      });
    }
  };

  // 편집 저장
  const handleSaveEdit = () => {
    if (!editingWord || updateWordMutation.isPending) return;

    const { wordId } = editingWord;
    const originalWord = allWords.find((w) => w.id === wordId);

    updateWordMutation.mutate(
      { wordId, meaning: editedMeaning, level: editedLevel },
      {
        onSuccess: () => {
          toast.success("단어가 저장되었습니다.", {
            action: {
              label: "취소",
              onClick: () => {
                if (!originalWord) return;

                updateWordMutation.mutate(
                  {
                    wordId,
                    meaning: originalWord.meaning,
                    level: originalWord.level,
                  },
                  {
                    onSuccess: () => toast.success("수정이 취소되었습니다."),
                  }
                );
              },
            },
          });

          clearEditingWord();
        },
      }
    );
  };

  const handleDownloadTxt = () => {
    downloadWordsAsTxt(filteredWords);
  };

  const handleDownloadCsv = () => {
    downloadWordsAsCsv(filteredWords);
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
        selectedLevels={selectedLevels}
        onLevelToggle={handleLevelClick}
        displayOptions={displayOptions}
        onDisplayOptionsChange={setDisplayOptions}
      />

      <MobileFilterSheet
        isOpen={isFilterOpen}
        onClose={toggleFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedYear={selectedYear}
        onYearChange={handleYearClick}
        selectedLevels={selectedLevels}
        onLevelChange={handleLevelClick}
        onReset={resetFilters}
      />

      <div className="flex flex-1 h-full w-full overflow-hidden">
        <Sidebar
          showJlptLevelOptions={false}
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
              {/* Sort Option */}
              <span className="shrink-0 px-3 py-1 bg-gray-200 text-text-primary text-xs font-medium rounded-full">
                {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
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
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filters Dropdown */}
                  <FilterDropdown
                    isFilterOpen={isFilterOpen}
                    selectedYear={selectedYear}
                    selectedLevels={selectedLevels}
                    onYearChange={handleYearClick}
                    onLevelChange={handleLevelClick}
                    onReset={resetFilters}
                    onToggle={toggleFilter}
                  />
                </div>
              </div>

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
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={cancelEdit}
                        onStartEdit={startEdit}
                        onDeleteWord={handleDeleteWord}
                        showFurigana={displayOptions.showFurigana}
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
