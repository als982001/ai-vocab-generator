import { ArrowUpDown, Download } from "lucide-react";

import type { DisplayOptions, Word } from "../types";
import { WordCard } from "./WordCard";

interface ResultPanelProps {
  words: Word[];
  displayOptions: DisplayOptions;
}

export function ResultPanel({ words, displayOptions }: ResultPanelProps) {
  return (
    <aside className="w-96 flex flex-col border-l border-border-color bg-surface-dark shrink-0 relative">
      <div className="p-6 border-b border-border-color flex items-center justify-between bg-surface-dark z-10 shrink-0">
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
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
        {words.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            showFurigana={displayOptions.showFurigana}
            showRomaji={displayOptions.showRomaji}
          />
        ))}
      </div>
      <div className="p-6 border-t border-border-color bg-surface-dark absolute bottom-0 w-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button className="w-full flex items-center justify-center gap-2 rounded-full h-12 bg-primary hover:bg-gray-800 text-white text-base font-bold transition-all shadow-lg hover:shadow-xl">
          <Download className="w-5 h-5" />
          <span>Download .txt</span>
        </button>
        <div className="mt-3 text-center">
          <button className="text-text-secondary text-xs hover:text-text-primary underline">
            Export to Anki Deck
          </button>
        </div>
      </div>
    </aside>
  );
}
