import { useEffect, useState } from "react";

import { Edit, Filter, Search, Trash2 } from "lucide-react";
import { Sidebar } from "~/features/dashboard/components/Sidebar";
import { deleteAnalysis, getAnalysisHistory } from "~/services/localStorage";
import type { DisplayOptions, JlptLevel, Word } from "~/types";

// 날짜를 상대 시간으로 포맷팅하는 유틸 함수
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";

  if (diffDays === 1) return "1 day ago";

  if (diffDays < 7) return `${diffDays} days ago`;

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// SavedAnalysis를 개별 단어로 변환 (날짜 정보 포함)
interface WordWithDate extends Word {
  date: string;
  analysisId: string;
}

export default function HistoryPage() {
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>("N3");
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });

  const [allWords, setAllWords] = useState<WordWithDate[]>([]);

  // 로컬 스토리지에서 히스토리 불러오기
  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = getAnalysisHistory();

      // 모든 분석 결과의 단어를 플랫하게 펼치기
      const words: WordWithDate[] = savedHistory.flatMap((analysis) =>
        analysis.words.map((word) => ({
          ...word,
          date: formatRelativeTime(analysis.createdAt),
          analysisId: analysis.id,
        }))
      );

      console.log("words", words);

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
      const updatedHistory = deleteAnalysis({ historyId, targetWord });

      const words: WordWithDate[] = updatedHistory.flatMap((analysis) =>
        analysis.words.map((word) => ({
          ...word,
          date: formatRelativeTime(analysis.createdAt),
          analysisId: analysis.id,
        }))
      );
      setAllWords(words);
    }
  };

  return (
    <div className="bg-background-dark text-text-primary font-display h-screen w-full overflow-hidden flex flex-col">
      <div className="flex flex-1 h-full w-full overflow-hidden">
        <Sidebar
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          displayOptions={displayOptions}
          onDisplayOptionsChange={setDisplayOptions}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#fafafa]">
          {/* Header */}
          <header className="h-16 border-b border-border-color bg-surface-light/80 backdrop-blur-sm sticky top-0 z-10 px-6 flex items-center justify-between shrink-0">
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
              <div className="mb-8 flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  Showing {allWords.length} vocabulary cards
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Sort by:
                  </span>
                  <select className="text-sm bg-transparent border-none p-0 pr-6 focus:ring-0 font-medium cursor-pointer text-text-primary">
                    <option>Newest First</option>
                    <option>Oldest First</option>
                    <option>JLPT Level</option>
                  </select>
                </div>
              </div>

              {/* Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allWords.map((word, index) => (
                  <div
                    key={index}
                    className="group relative bg-white border border-border-color rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between h-64"
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-start">
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                        {word.level}
                      </span>
                      <span className="text-[11px] text-text-secondary font-medium">
                        {word.date}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-col items-center text-center my-auto w-full">
                      <p className="text-xs text-text-secondary mb-1">
                        {word.reading}
                      </p>
                      <h3 className="text-4xl font-bold text-text-primary mb-4">
                        {word.word}
                      </h3>
                      <div className="w-8 h-px bg-border-color mb-4"></div>
                      <p className="text-sm text-text-secondary font-medium line-clamp-2">
                        {word.meaning}
                      </p>
                    </div>

                    {/* Card Actions (Hover) */}
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        className="size-8 rounded-full bg-surface-highlight flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteWord({
                            historyId: word.analysisId,
                            targetWord: word.word,
                          })
                        }
                        className="size-8 rounded-full bg-surface-highlight flex items-center justify-center text-text-secondary hover:bg-red-500 hover:text-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
