import { Volume2 } from "lucide-react";
import type { IWordWithDate } from "~/features/history/types";
import { playTTS } from "~/services/tts";

interface IMobileWordCardProps {
  word: IWordWithDate;
}

export function MobileWordCard({ word }: IMobileWordCardProps) {
  return (
    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm transition-all duration-200 active:scale-[0.98]">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex h-8 w-8 items-center justify-center bg-primary rounded-full">
          <span className="text-white text-xs font-bold">{word.level}</span>
        </div>
        <span className="text-xs text-gray-400 font-medium">{word.date}</span>
      </div>

      {/* Card Body */}
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-text-primary mb-1">
          <ruby>
            {word.word}
            <rt className="text-sm text-text-secondary font-normal">
              {word.reading}
            </rt>
          </ruby>
        </h2>
        <p className="text-lg text-text-secondary">{word.meaning}</p>
      </div>

      {/* Card Actions */}
      <div className="flex items-center">
        <button
          onClick={() => playTTS(word.word)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          title="듣기"
        >
          <Volume2 className="w-5 h-5 text-text-primary" />
        </button>
      </div>
    </div>
  );
}
