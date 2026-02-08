import { ArrowUpDown, FileSearch } from "lucide-react";
import {
  AnimatedList,
  AnimatedListItem,
} from "~/components/motion/AnimatedList";
import { DownloadDropdown } from "~/components/shared/DownloadDropdown";
import { WordCard } from "~/features/dashboard/components/WordCard";
import type { IDisplayOptions, IWord } from "~/types";

interface IResultPanelProps {
  words: IWord[];
  displayOptions: IDisplayOptions;
  onDownloadTxt: () => void;
  onDownloadCsv: () => void;
  hoveredWordIndex: number | null;
  onHover: (index: number | null) => void;
  onWordCardClick?: (index: number) => void;
  highlightedIndex?: number | null;
}

export function ResultPanel({
  words,
  displayOptions,
  onDownloadTxt,
  onDownloadCsv,
  hoveredWordIndex,
  onHover,
  onWordCardClick,
  highlightedIndex,
}: IResultPanelProps) {
  return (
    <aside className="flex-1 md:w-[350px] md:flex-none flex flex-col bg-white md:bg-gray-50 rounded-t-xl md:rounded-none -mt-4 md:mt-0 relative shadow-sm z-10 overflow-hidden">
      {/* 모바일 드래그 핸들 */}
      <div className="md:hidden flex justify-center py-3">
        <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
      </div>

      <div className="h-24 p-6 pt-0 md:pt-6 flex items-center justify-between bg-white z-10 shrink-0 shadow-sm">
        <div>
          <h2 className="text-text-primary text-lg font-bold">
            Extracted Words
          </h2>
          <p className="text-text-secondary text-xs mt-1">
            Found {words.length} items from last scan
          </p>
        </div>
        <div className="flex gap-2">
          <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-highlight text-text-secondary transition-colors">
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 md:h-[calc(100vh-226px)] overflow-y-auto p-4 flex flex-col">
        {words.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <FileSearch className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">
                아직 분석된 단어가 없습니다
              </p>
              <p className="text-text-secondary text-sm">
                이미지를 업로드하면 자동으로 단어를 추출합니다
              </p>
            </div>
          </div>
        ) : (
          <AnimatedList className="flex flex-col gap-3">
            {words.map((word, index) => (
              <AnimatedListItem key={index}>
                <div id={`word-card-${index}`}>
                  <WordCard
                    word={word}
                    showFurigana={displayOptions.showFurigana}
                    showRomaji={displayOptions.showRomaji}
                    isHovered={hoveredWordIndex === index}
                    isHighlighted={highlightedIndex === index}
                    onHover={(hovered) => onHover(hovered ? index : null)}
                    onClick={() => onWordCardClick?.(index)}
                  />
                </div>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        )}
      </div>
      <div className="hidden md:block h-[130px] p-6 bg-white absolute bottom-0 w-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <DownloadDropdown
          wordCount={words.length}
          onDownloadTxt={onDownloadTxt}
          onDownloadCsv={onDownloadCsv}
          disabled={words.length === 0}
        />
        <div className="mt-3 text-center">
          <button className="text-text-secondary text-xs hover:text-text-primary underline">
            Export to Anki Deck
          </button>
        </div>
      </div>
    </aside>
  );
}
