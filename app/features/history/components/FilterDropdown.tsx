import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  GraduationCap,
  Languages,
  SlidersHorizontal,
} from "lucide-react";
import type { Language, WordLevel } from "~/types";
import { LANGUAGES, LANGUAGE_CONFIG } from "~/utils/language";

interface IFilterDropdownProps {
  isFilterOpen: boolean;
  selectedLanguage: Language;
  availableYears: number[];
  selectedYear: number | null;
  selectedLevels: WordLevel[];
  onLanguageChange: (language: Language) => void;
  onYearChange: (year: number) => void;
  onLevelChange: (level: WordLevel) => void;
  onReset: () => void;
  onToggle: () => void;
}

export function FilterDropdown({
  isFilterOpen,
  selectedLanguage,
  availableYears,
  selectedYear,
  selectedLevels,
  onLanguageChange,
  onYearChange,
  onLevelChange,
  onReset,
  onToggle,
}: IFilterDropdownProps) {
  const { levels, levelTitle } = LANGUAGE_CONFIG[selectedLanguage];

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border-color rounded-lg hover:border-gray-300 transition-colors shadow-sm select-none"
      >
        <SlidersHorizontal className="w-[18px] h-[18px] text-text-secondary" />
        <span className="text-sm font-medium text-text-primary">Filters</span>
        <ChevronDown
          className={`w-4 h-4 text-text-secondary transition-transform ${
            isFilterOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-full mt-2 w-72 bg-white border border-border-color rounded-xl shadow-xl p-5 flex flex-col gap-5 z-50"
          >
            {/* Language Section */}
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Languages className="w-4 h-4 text-text-secondary" />
                Language
              </h4>
              <div className="flex gap-2">
                {LANGUAGES.map((language) => (
                  <button
                    key={language}
                    onClick={() => onLanguageChange(language)}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                      selectedLanguage === language
                        ? "bg-primary text-white border-transparent shadow-sm"
                        : "border-border-color text-text-secondary hover:bg-surface-highlight"
                    }`}
                  >
                    {LANGUAGE_CONFIG[language].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border-color"></div>

            {/* Created At Section */}
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-secondary" />
                Created At
              </h4>
              <div className="flex gap-2">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => onYearChange(year)}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                      selectedYear === year
                        ? "bg-primary text-white border-transparent shadow-sm"
                        : "border-border-color text-text-secondary hover:bg-surface-highlight"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border-color"></div>

            {/* Level Section */}
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-text-secondary" />
                {levelTitle}
              </h4>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => onLevelChange(level)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      selectedLevels.includes(level)
                        ? "bg-primary text-white border-transparent shadow-sm"
                        : "border-border-color text-text-secondary hover:bg-surface-highlight"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex justify-end gap-3 items-center">
              <button
                onClick={onReset}
                className="text-xs font-medium text-text-secondary hover:text-primary transition-colors"
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
