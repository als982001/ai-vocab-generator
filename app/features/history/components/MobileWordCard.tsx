import { Volume2 } from "lucide-react";
import type { IWordWithDate } from "~/features/history/types";
import { playTTS } from "~/services/tts";
import type { IDisplayOptions } from "~/types";
import { LANGUAGE_CONFIG, getWordVisibility } from "~/utils/language";

interface IMobileWordCardProps {
  word: IWordWithDate;
  displayOptions: IDisplayOptions;
}

export function MobileWordCard({ word, displayOptions }: IMobileWordCardProps) {
  const { showReading, showPartOfSpeech } = getWordVisibility({
    language: word.language,
    displayOptions,
  });

  return (
    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm transition-all duration-200 active:scale-[0.98]">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="flex h-8 min-w-8 px-2 items-center justify-center bg-primary rounded-full"
          title={LANGUAGE_CONFIG[word.language].levelTooltip}
        >
          <span className="text-white text-xs font-bold">
            {word.level ?? "등급 미정"}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">{word.date}</span>
      </div>

      {/* Card Body */}
      <div className="mb-4">
        {word.language === "ja" ? (
          <h2 className="text-3xl font-bold text-text-primary mb-1">
            <ruby>
              {word.word}
              {/* invisible로 자리를 유지해 토글 시 카드 높이가 바뀌지 않도록 */}
              <rt
                className={`text-sm text-text-secondary font-normal ${showReading ? "visible" : "invisible"}`}
              >
                {word.reading}
              </rt>
            </ruby>
          </h2>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-text-primary">
              {word.word}
            </h2>
            <div className="flex items-center gap-2 mb-1 text-sm text-text-secondary">
              <span className={showReading ? "visible" : "invisible"}>
                {word.reading}
              </span>
              {showPartOfSpeech && word.part_of_speech && (
                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-xs">
                  {word.part_of_speech}
                </span>
              )}
            </div>
          </>
        )}
        <p className="text-lg text-text-secondary">{word.meaning}</p>
      </div>

      {/* Card Actions */}
      <div className="flex items-center">
        <button
          onClick={() =>
            playTTS({ text: word.word, language: word.language }).catch(
              () => {}
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          title="듣기"
        >
          <Volume2 className="w-5 h-5 text-text-primary" />
        </button>
      </div>
    </div>
  );
}
