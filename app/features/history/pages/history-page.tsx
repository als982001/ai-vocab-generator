import { useEffect, useMemo, useState } from "react";

import {
  Calendar,
  ChevronDown,
  Filter,
  GraduationCap,
  Search,
  Share,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { MobileHeader } from "~/components/shared/MobileHeader";
import { SidebarDrawer } from "~/components/shared/SidebarDrawer";
import { Sidebar } from "~/features/dashboard/components/Sidebar";
import { DesktopWordCard } from "~/features/history/components/DesktopWordCard";
import { MobileFilterSheet } from "~/features/history/components/MobileFilterSheet";
import { MobileWordCard } from "~/features/history/components/MobileWordCard";
import { useWordEdit } from "~/features/history/hooks/useWordEdit";
import { useWordFilter } from "~/features/history/hooks/useWordFilter";
import type { IWordWithDate, SortOption } from "~/features/history/types";
import {
  addWordToAnalysis,
  deleteAnalysis,
  getAnalysisHistory,
  updateWordInAnalysis,
} from "~/services/localStorage";
import type { IDisplayOptions, JlptLevel } from "~/types";
import { formatRelativeTime } from "~/utils/date";
import { JLPT_LEVELS, levelToNumber } from "~/utils/jlpt";

export default function HistoryPage() {
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>("N3");
  const [displayOptions, setDisplayOptions] = useState<IDisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });

  const [allWords, setAllWords] = useState<IWordWithDate[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // 로컬 스토리지에서 히스토리 불러오기
  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = getAnalysisHistory();

      // 모든 분석 결과의 단어를 플랫하게 펼치기
      const words: IWordWithDate[] = savedHistory.flatMap((analysis) =>
        analysis.words.map((word) => ({
          ...word,
          date: formatRelativeTime(analysis.createdAt),
          createdAt: analysis.createdAt,
          analysisId: analysis.id,
        }))
      );

      setAllWords(words);
    };

    loadHistory();
  }, []);

  const handleDeleteWord = ({
    historyId,
    targetWord,
  }: {
    historyId: string;
    targetWord: string;
  }) => {
    if (confirm("정말 이 단어를 삭제하시겠습니까?")) {
      // 삭제 전 백업
      const deletedWord = allWords.find(
        (w) => w.analysisId === historyId && w.word === targetWord
      );

      const updatedHistory = deleteAnalysis({ historyId, targetWord });

      const words: IWordWithDate[] = updatedHistory.flatMap((analysis) =>
        analysis.words.map((word) => ({
          ...word,
          date: formatRelativeTime(analysis.createdAt),
          createdAt: analysis.createdAt,
          analysisId: analysis.id,
        }))
      );

      toast.success("단어가 삭제되었습니다.", {
        action: {
          label: "취소",
          onClick: () => {
            if (!deletedWord) return;

            const { word, reading, meaning, level } = deletedWord;

            // 삭제된 단어를 다시 추가
            const restoredHistory = addWordToAnalysis({
              historyId,
              deletedWord: { word, reading, meaning, level },
            });

            const restoredWords: IWordWithDate[] = restoredHistory.flatMap(
              (analysis) =>
                analysis.words.map((word) => ({
                  ...word,
                  date: formatRelativeTime(analysis.createdAt),
                  createdAt: analysis.createdAt,
                  analysisId: analysis.id,
                }))
            );

            setAllWords(restoredWords);
            toast.success("삭제가 취소되었습니다.");
          },
        },
      });

      setAllWords(words);
    }
  };

  // 편집 저장
  const handleSaveEdit = () => {
    if (!editingWord) return;

    // 편집 전 원본 데이터 백업
    const originalWord = allWords.find(
      (w) =>
        w.analysisId === editingWord!.historyId && w.word === editingWord!.word
    );

    const updatedHistory = updateWordInAnalysis({
      historyId: editingWord.historyId,
      targetWord: editingWord.word,
      newMeaning: editedMeaning,
      newLevel: editedLevel,
    });

    const words: IWordWithDate[] = updatedHistory.flatMap((analysis) =>
      analysis.words.map((word) => ({
        ...word,
        date: formatRelativeTime(analysis.createdAt),
        createdAt: analysis.createdAt,
        analysisId: analysis.id,
      }))
    );

    toast.success("단어가 저장되었습니다.", {
      action: {
        label: "취소",
        onClick: () => {
          if (!originalWord || !editingWord) return;

          // 원본 데이터로 복원
          const restoredHistory = updateWordInAnalysis({
            historyId: editingWord.historyId,
            targetWord: editingWord.word,
            newMeaning: originalWord.meaning,
            newLevel: originalWord.level,
          });

          const restoredWords: IWordWithDate[] = restoredHistory.flatMap(
            (analysis) =>
              analysis.words.map((word) => ({
                ...word,
                date: formatRelativeTime(analysis.createdAt),
                createdAt: analysis.createdAt,
                analysisId: analysis.id,
              }))
          );

          setAllWords(restoredWords);
          toast.success("수정이 취소되었습니다.");
        },
      },
    });

    setAllWords(words);
    clearEditingWord();
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

    return words;
  }, [sortedWords, selectedYear, selectedLevels]);

  return (
    <div className="bg-background-dark text-text-primary font-display h-screen w-full overflow-hidden flex flex-col">
      <MobileHeader
        title="History"
        onRightClick={toggleFilter}
        rightIcon={<SlidersHorizontal className="w-6 h-6 text-text-primary" />}
      />

      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
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
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          displayOptions={displayOptions}
          onDisplayOptionsChange={setDisplayOptions}
          className="hidden md:flex"
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#fafafa]">
          {/* Mobile Search Bar */}
          <div className="md:hidden px-4 py-3 bg-white">
            <label className="relative flex items-center w-full">
              <Search className="absolute left-4 w-5 h-5 text-text-secondary" />
              <input
                className="w-full h-12 pl-12 pr-4 bg-gray-100 border-none rounded-full text-base focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-secondary"
                placeholder="Search vocabulary..."
                type="text"
              />
            </label>
          </div>

          {/* Header - Desktop only */}
          <header className="hidden md:flex h-16 border-b border-border-color bg-surface-light/80 backdrop-blur-sm sticky top-0 z-10 px-6 items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-text-primary">
                History
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
                <input
                  className="pl-10 pr-4 py-2 w-64 text-sm bg-white border border-border-color rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-text-secondary"
                  placeholder="Search vocabulary..."
                  type="text"
                />
              </div>
              {/* Filter Button */}
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-border-color rounded-lg hover:bg-surface-highlight transition-colors">
                <Filter className="w-5 h-5 text-text-secondary" />
                <span className="text-sm font-medium text-text-secondary hidden sm:inline">
                  Filter
                </span>
              </button>
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
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="level-easy">Level: N5 → N1</option>
                      <option value="level-hard">Level: N1 → N5</option>
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
                    {isFilterOpen && (
                      <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-border-color rounded-xl shadow-xl p-5 flex flex-col gap-5 z-50">
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
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Card Grid */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWords.map((word, index) => {
                  const isEditing = checkIsEditing(word);

                  return (
                    <DesktopWordCard
                      key={index}
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
                    />
                  );
                })}
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden flex flex-col gap-4">
                {filteredWords.map((word, index) => (
                  <MobileWordCard key={index} word={word} />
                ))}
              </div>
            </div>
          </div>

          {/* FAB - Hidden until feature is implemented */}
          <button
            className="hidden fixed bottom-8 right-6 h-16 w-16 items-center justify-center bg-primary rounded-full shadow-lg active:scale-95 transition-transform md:hidden"
            onClick={() => {
              // TODO: 내보내기 기능 구현 예정
            }}
          >
            <Share className="w-7 h-7 text-white" />
          </button>
        </main>
      </div>
    </div>
  );
}
