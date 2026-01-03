import { useState } from "react";

import { Edit, Filter, Search, Trash2 } from "lucide-react";
import { Sidebar } from "~/features/dashboard/components/Sidebar";
import type { DisplayOptions, JlptLevel } from "~/types";

export default function HistoryPage() {
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>("N3");
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });

  // 임시 목 데이터 (나중에 로컬 스토리지에서 불러올 예정)
  const mockWords = [
    {
      word: "先生",
      reading: "せんせい",
      meaning: "Teacher; Instructor; Master.",
      level: "N5",
      date: "2 days ago",
    },
    {
      word: "学生",
      reading: "がくせい",
      meaning: "Student (especially a university student).",
      level: "N5",
      date: "1 week ago",
    },
    {
      word: "会社",
      reading: "かいしゃ",
      meaning: "Company; Corporation; Workplace.",
      level: "N4",
      date: "Oct 12",
    },
    {
      word: "食べる",
      reading: "たべる",
      meaning: "To eat.",
      level: "N5",
      date: "Oct 10",
    },
    {
      word: "日本",
      reading: "にほん",
      meaning: "Japan.",
      level: "N5",
      date: "Sep 28",
    },
    {
      word: "勉強",
      reading: "べんきょう",
      meaning: "Study; Diligence.",
      level: "N4",
      date: "Sep 25",
    },
  ];

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
                  Showing {mockWords.length} vocabulary cards
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
                {mockWords.map((word, index) => (
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
