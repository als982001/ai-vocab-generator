import { Edit, Volume2 } from "lucide-react";

import type { Word } from "../types";

interface WordCardProps {
  word: Word;
  showFurigana?: boolean;
  showRomaji?: boolean;
}

export function WordCard({
  word,
  showFurigana = true,
  // showRomaji = false,
}: WordCardProps) {
  console.log("word", word);

  return (
    <div className="bg-white rounded-xl p-4 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit className="text-text-secondary hover:text-text-primary w-4 h-4" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          {showFurigana && (
            <p className="text-text-secondary text-xs font-japanese">
              {word.reading}
            </p>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-black text-white">
            {word.level}
          </span>
        </div>
        <h3 className="text-text-primary text-2xl font-bold font-japanese mb-1">
          {word.word}
        </h3>
        <div className="h-px w-full bg-gray-100 my-2"></div>
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm font-medium">{word.meaning} </p>
          <Volume2 className="text-text-primary w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}
