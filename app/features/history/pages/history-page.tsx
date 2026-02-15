import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  GraduationCap,
  History,
  Search,
  SlidersHorizontal,
} from "lucide-react";
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
import { MobileFilterSheet } from "~/features/history/components/MobileFilterSheet";
import { MobileWordCard } from "~/features/history/components/MobileWordCard";
import { SORT_OPTIONS } from "~/features/history/constants/sort";
import { useAnalysisHistory } from "~/features/history/hooks/useAnalysisHistory";
import { useWordEdit } from "~/features/history/hooks/useWordEdit";
import { useWordFilter } from "~/features/history/hooks/useWordFilter";
import {
  useDeleteWord,
  useRestoreWord,
  useUpdateWord,
} from "~/features/history/hooks/useWordMutations";
import type { IWordWithDate, SortOption } from "~/features/history/types";
import type { IDisplayOptions, JlptLevel } from "~/types";
import { PAGE_TRANSITION, PAGE_TRANSITION_DURATION } from "~/utils/animation";
import { formatRelativeTime } from "~/utils/date";
import { JLPT_LEVELS, levelToNumber } from "~/utils/jlpt";

export default function HistoryPage() {
  const [displayOptions, setDisplayOptions] = useState<IDisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const deleteWordMutation = useDeleteWord();
  const updateWordMutation = useUpdateWord();
  const restoreWordMutation = useRestoreWord();

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

  const handleDeleteWord = (targetWord: IWordWithDate) => {
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
    if (!editingWord) return;

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
        ); // N5 -> N4 -> N3 -> N2 -> N1
      case "level-hard":
        return words.sort(
          (a, b) => levelToNumber(a.level) - levelToNumber(b.level)
        ); // N1 -> N2 -> N3 -> N4 -> N5
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

  const handleDownloadTxt = () => {
    downloadWordsAsTxt(filteredWords);
  };

  const handleDownloadCsv = () => {
    downloadWordsAsCsv(filteredWords);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchQuery(searchInput);
    }
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
                  <div className="relative">
                    <button
                      onClick={toggleFilter}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border-color rounded-lg hover:border-gray-300 transition-colors shadow-sm select-none"
                    >
                      <SlidersHorizontal className="w-[18px] h-[18px] text-text-secondary" />
                      <span className="text-sm font-medium text-text-primary">
                        Filters
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-text-secondary transition-transform ${
                          isFilterOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Filter Panel */}
                    <AnimatePresence>
                      {isFilterOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          style={{ transformOrigin: "top right" }}
                          className="absolute right-0 top-full mt-2 w-72 bg-white border border-border-color rounded-xl shadow-xl p-5 flex flex-col gap-5 z-50"
                        >
                          {/* Created At Section */}
                          <div>
                            <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-text-secondary" />
                              Created At
                            </h4>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleYearClick(2025)}
                                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                                  selectedYear === 2025
                                    ? "bg-primary text-white border-transparent shadow-sm"
                                    : "border-border-color text-text-secondary hover:bg-surface-highlight"
                                }`}
                              >
                                2025
                              </button>
                              <button
                                onClick={() => handleYearClick(2026)}
                                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                                  selectedYear === 2026
                                    ? "bg-primary text-white border-transparent shadow-sm"
                                    : "border-border-color text-text-secondary hover:bg-surface-highlight"
                                }`}
                              >
                                2026
                              </button>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-border-color"></div>

                          {/* JLPT Level Section */}
                          <div>
                            <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-text-secondary" />
                              JLPT Level
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {JLPT_LEVELS.map((level) => (
                                <button
                                  key={level}
                                  onClick={() => handleLevelClick(level)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                    selectedLevels.includes(level)
                                      ? "bg-primary text-white border-transparent shadow-sm"
                                      : "border-border-color text-text-secondary hover:bg-surface-highlight"
                                  }`}
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-1 flex justify-end gap-3 items-center">
                            <button
                              onClick={resetFilters}
                              className="text-xs font-medium text-text-secondary hover:text-primary transition-colors"
                            >
                              Reset
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
