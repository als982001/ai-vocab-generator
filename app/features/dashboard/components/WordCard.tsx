import { Volume2 } from "lucide-react";
import { playTTS } from "~/services/tts";
import type { IDisplayOptions, IWord, Language } from "~/types";
import { LANGUAGE_CONFIG, getWordVisibility } from "~/utils/language";

interface IWordCardProps {
  word: IWord;
  language: Language;
  displayOptions: IDisplayOptions;
  isHovered?: boolean;
  isHighlighted?: boolean;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

export function WordCard({
  word,
  language,
  displayOptions,
  isHovered = false,
  isHighlighted = false,
  onHover,
  onClick,
}: IWordCardProps) {
  const { fontClassName, levelTooltip } = LANGUAGE_CONFIG[language];
  const { showReading, showPartOfSpeech } = getWordVisibility({
    language,
    displayOptions,
  });

  return (
    <div
      className={`shrink-0 bg-white rounded-xl p-4 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden shadow-sm ${
        isHovered ? "ring-2 ring-red-500 shadow-lg" : ""
      } ${isHighlighted ? "animate-highlight-pulse" : ""}`}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={`text-text-secondary text-xs ${fontClassName} ${showReading ? "visible" : "invisible"}`}
          >
            {word.reading}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {showPartOfSpeech && word.part_of_speech && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-text-secondary">
                {word.part_of_speech}
              </span>
            )}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-black text-white"
              title={levelTooltip}
            >
              {word.level ?? "등급 미정"}
            </span>
          </div>
        </div>
        <h3
          className={`text-text-primary text-2xl font-bold mb-1 ${fontClassName}`}
        >
          {word.word}
        </h3>
        <div className="h-px w-full bg-gray-100 my-2"></div>
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm font-medium">{word.meaning} </p>
          <button
            onClick={() =>
              playTTS({ text: word.word, language }).catch(() => {})
            }
          >
            <Volume2 className="text-text-primary w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  );
}
