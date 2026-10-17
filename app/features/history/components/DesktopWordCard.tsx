import { Check, Edit, Trash2, Volume2, X } from "lucide-react";
import type { IWordWithDate } from "~/features/history/types";
import { playTTS } from "~/services/tts";
import type { IDisplayOptions, WordLevel } from "~/types";
import { LANGUAGE_CONFIG, getWordVisibility } from "~/utils/language";

interface IDesktopWordCardProps {
  word: IWordWithDate;
  isEditing: boolean;
  editedMeaning: string;
  editedLevel: WordLevel | null;
  displayOptions: IDisplayOptions;
  onEditedMeaningChange: (value: string) => void;
  onEditedLevelChange: (level: WordLevel) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: (word: IWordWithDate) => void;
  onDeleteWord: (word: IWordWithDate) => void;
}

export function DesktopWordCard({
  word,
  isEditing,
  editedMeaning,
  editedLevel,
  displayOptions,
  onEditedMeaningChange,
  onEditedLevelChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDeleteWord,
}: IDesktopWordCardProps) {
  const { levels, levelTooltip } = LANGUAGE_CONFIG[word.language];
  const { showReading, showPartOfSpeech } = getWordVisibility({
    language: word.language,
    displayOptions,
  });

  return (
    <div className="group relative bg-white border border-border-color rounded-xl p-5 hover:border-gray-300 hover:shadow-sm hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-64">
      {/* Card Header */}
      <div className="flex justify-between items-start">
        {isEditing ? (
          <div className="flex gap-1 flex-wrap">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => onEditedLevelChange(level)}
                className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide transition-colors ${
                  editedLevel === level
                    ? "bg-primary text-white"
                    : "bg-white text-black border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        ) : (
          <span
            className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide"
            title={levelTooltip}
          >
            {word.level ?? "등급 미정"}
          </span>
        )}
        <span className="text-[11px] text-text-secondary group-hover:text-text-primary font-medium transition-colors">
          {word.date}
        </span>
      </div>

      {/* Card Body */}
      <div className="flex flex-col items-center text-center my-auto w-full">
        {/* 읽기와 품사를 형제로 둬야 읽기를 숨겨도 품사가 같이 숨지 않음 */}
        <div className="flex items-center justify-center gap-2 mb-1 text-xs text-text-secondary">
          <span className={showReading ? "visible" : "invisible"}>
            {word.reading}
          </span>
          {showPartOfSpeech && word.part_of_speech && (
            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px]">
              {word.part_of_speech}
            </span>
          )}
        </div>

        <h3 className="text-4xl font-bold text-text-primary mb-4">
          {word.word}
        </h3>
        <div className="w-8 h-px bg-border-color mb-4"></div>
        {isEditing ? (
          <input
            type="text"
            value={editedMeaning}
            onChange={(e) => onEditedMeaningChange(e.target.value)}
            className="w-full text-sm text-text-primary font-medium text-center border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="단어 뜻 입력"
          />
        ) : (
          <p className="text-sm text-text-secondary font-medium line-clamp-2">
            {word.meaning}
          </p>
        )}
      </div>

      {/* Card Actions */}
      {/* Listen Button - 왼쪽에 항상 표시 (수정 중이 아닐 때만) */}
      {!isEditing && (
        <button
          onClick={() =>
            playTTS({ text: word.word, language: word.language }).catch(
              () => {}
            )
          }
          className="absolute bottom-4 left-4 size-8 rounded-full bg-surface-highlight flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white active:scale-125 transition-all"
          title="듣기"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      )}

      {/* Edit/Delete or Save/Cancel - 오른쪽에 hover 시 표시 */}
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {isEditing ? (
          <>
            <button
              onClick={onSaveEdit}
              className="size-8 rounded-full bg-surface-highlight flex items-center justify-center text-text-secondary hover:bg-green-500 hover:text-white transition-colors"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelEdit}
              className="size-8 rounded-full bg-surface-highlight flex items-center justify-center text-text-secondary hover:bg-gray-500 hover:text-white transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onStartEdit(word)}
              className="size-8 rounded-full bg-surface-highlight flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteWord(word)}
              className="size-8 rounded-full bg-surface-highlight flex items-center justify-center text-text-secondary hover:bg-red-500 hover:text-white transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
