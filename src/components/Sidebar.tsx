import { History, LayoutDashboard, Settings } from "lucide-react";

import type { DisplayOptions, JlptLevel } from "../types";

interface SidebarProps {
  selectedLevel: JlptLevel;
  onLevelChange: (level: JlptLevel) => void;
  displayOptions: DisplayOptions;
  onDisplayOptionsChange: (options: DisplayOptions) => void;
}

export function Sidebar({
  selectedLevel,
  onLevelChange,
  displayOptions,
  onDisplayOptionsChange,
}: SidebarProps) {
  const jlptLevels: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

  return (
    <aside className="w-72 flex flex-col bg-white shrink-0 overflow-y-auto z-20 shadow-sm">
      <div className="p-6 pb-2">
        <div className="flex flex-col">
          <h1 className="text-text-primary text-2xl font-bold leading-normal tracking-tight">
            Snap Voca
          </h1>
          <p className="text-text-secondary text-sm font-normal leading-normal">
            Vocab Generator
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 px-4 py-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-surface-highlight cursor-pointer transition-colors">
          <LayoutDashboard className="text-text-primary w-5 h-5" />
          <p className="text-text-primary text-sm font-bold leading-normal">
            Dashboard
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-surface-highlight/50 cursor-pointer transition-colors group">
          <History className="text-text-secondary group-hover:text-text-primary w-5 h-5" />
          <p className="text-text-secondary group-hover:text-text-primary text-sm font-medium leading-normal">
            History
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-surface-highlight/50 cursor-pointer transition-colors group">
          <Settings className="text-text-secondary group-hover:text-text-primary w-5 h-5" />
          <p className="text-text-secondary group-hover:text-text-primary text-sm font-medium leading-normal">
            Settings
          </p>
        </div>
      </div>
      <div className="px-4 py-4">
        <h3 className="tracking-wide text-xs uppercase font-bold px-2 mb-4 text-text-secondary">
          JLPT Level
        </h3>
        <div className="flex gap-2 flex-wrap px-2">
          {jlptLevels.map((level) => (
            <button
              key={level}
              onClick={() => onLevelChange(level)}
              className={`flex h-8 items-center justify-center rounded-full transition-colors px-4 border ${
                selectedLevel === level
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-highlight hover:bg-primary hover:text-white border-transparent hover:border-primary"
              }`}
            >
              <p className="text-xs font-bold leading-normal">{level}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-2 flex flex-col gap-3">
        <h3 className="tracking-wide text-xs uppercase font-bold px-2 mb-2 text-text-secondary">
          Display Options
        </h3>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-dark p-4">
          <div className="flex flex-col">
            <p className="text-text-primary text-base font-bold">
              Show Furigana
            </p>
          </div>
          <button
            onClick={() => {
              onDisplayOptionsChange({
                ...displayOptions,
                showFurigana: !displayOptions.showFurigana,
              });
            }}
            className="w-12 h-12 rounded-full bg-white shadow-sm border-2 border-gray-200 hover:border-primary transition-colors font-bold text-lg"
          >
            {displayOptions.showFurigana ? "O" : "X"}
          </button>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-dark p-4">
          <div className="flex flex-col">
            <p className="text-text-primary text-base font-bold">Show Romaji</p>
          </div>
          <button
            onClick={() => {
              onDisplayOptionsChange({
                ...displayOptions,
                showRomaji: !displayOptions.showRomaji,
              });
            }}
            className="w-12 h-12 rounded-full bg-white shadow-sm border-2 border-gray-200 hover:border-primary transition-colors font-bold text-lg"
          >
            {displayOptions.showRomaji ? "O" : "X"}
          </button>
        </div>
      </div>
      <div className="mt-auto p-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-dark">
          <div className="h-10 w-10 rounded-full bg-text-primary flex items-center justify-center text-white font-bold">
            JD
          </div>
          <div className="flex flex-col">
            <p className="text-text-primary text-sm font-bold">Jane Doe</p>
            <p className="text-text-secondary text-xs">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
