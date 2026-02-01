import { Calendar, Check, GraduationCap } from "lucide-react";
import type { SortOption } from "~/features/history/types";
import type { JlptLevel } from "~/types";
import { JLPT_LEVELS } from "~/utils/jlpt";

interface IMobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedYear: number | null;
  onYearChange: (year: number) => void;
  selectedLevels: JlptLevel[];
  onLevelChange: (level: JlptLevel) => void;
  onReset: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "level-easy", label: "Level N5 → N1" },
  { value: "level-hard", label: "Level N1 → N5" },
];

export function MobileFilterSheet({
  isOpen,
  onClose,
  sortBy,
  onSortChange,
  selectedYear,
  onYearChange,
  selectedLevels,
  onLevelChange,
  onReset,
}: IMobileFilterSheetProps) {
  const handleReset = () => {
    onReset();
  };

  const handleShowResults = () => {
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] max-h-[85vh] overflow-y-auto shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        <div className="px-6 py-4">
          {/* Sort By Section */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Sort By
            </h3>
            <div className="space-y-1">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={`w-full flex items-center justify-between py-3 ${
                    sortBy !== option.value ? "opacity-60" : ""
                  }`}
                >
                  <span className="text-lg font-medium text-text-primary">
                    {option.label}
                  </span>
                  <Check
                    className={`w-5 h-5 ${
                      sortBy === option.value
                        ? "text-text-primary"
                        : "text-transparent"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Created At Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-[18px] h-[18px] text-gray-400" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Created At
              </h3>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onYearChange(2025)}
                className={`flex-1 py-3 px-4 border-2 rounded-2xl font-bold transition-all ${
                  selectedYear === 2025
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                2025
              </button>
              <button
                onClick={() => onYearChange(2026)}
                className={`flex-1 py-3 px-4 border-2 rounded-2xl font-bold transition-all ${
                  selectedYear === 2026
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                2026
              </button>
            </div>
          </div>

          {/* JLPT Level Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                JLPT Level
              </h3>
            </div>
            <div className="flex justify-between items-center">
              {JLPT_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => onLevelChange(level)}
                  className={`h-12 w-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    selectedLevels.includes(level)
                      ? "bg-primary text-white"
                      : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-2 pb-6">
            <button
              onClick={handleReset}
              className="flex-1 py-4 text-gray-500 font-bold hover:text-primary transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleShowResults}
              className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              Show Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
