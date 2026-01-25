import { Link, useLocation } from "react-router";

import { History, LayoutDashboard, Settings } from "lucide-react";
import type { IDisplayOptions, JlptLevel } from "~/types";

interface ISidebarProps {
  selectedLevel: JlptLevel;
  onLevelChange: (level: JlptLevel) => void;
  displayOptions: IDisplayOptions;
  onDisplayOptionsChange: (options: IDisplayOptions) => void;
  className?: string;
}

export function Sidebar({
  selectedLevel,
  onLevelChange,
  displayOptions,
  onDisplayOptionsChange,
  className = "",
}: ISidebarProps) {
  const jlptLevels: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];
  const location = useLocation();

  const { pathname } = location;

  return (
    <aside
      className={`w-72 h-full bg-surface-dark overflow-y-auto shrink-0 border-r border-border-color flex flex-col ${className}`}
    >
      <div className="p-6 pb-2">
        <div className="flex flex-col h-[57px]">
          <h1 className="text-2xl font-bold leading-normal tracking-tight">
            Snap Voca
          </h1>
          <p className="text-text-secondary text-sm font-normal leading-normal">
            Vocab Generator
          </p>
        </div>
      </div>
      <div className="flex flex-col p-4 gap-2">
        <Link to="/">
          <div
            className={`flex items-center gap-3 cursor-pointer h-12 px-4 py-3 rounded-full transition-colors ${
              pathname === "/"
                ? "bg-surface-highlight"
                : "hover:bg-surface-highlight/50 group"
            }`}
          >
            <LayoutDashboard
              className={`w-5 h-5 ${
                pathname === "/"
                  ? "text-text-primary"
                  : "text-text-secondary group-hover:text-text-primary"
              }`}
            />
            <p
              className={`leading-normal font-bold text-sm ${
                pathname === "/"
                  ? "text-text-primary"
                  : "text-text-secondary group-hover:text-text-primary"
              }`}
            >
              Dashboard
            </p>
          </div>
        </Link>
        <Link to="/history">
          <div
            className={`flex items-center gap-3 cursor-pointer h-12 px-4 py-3 rounded-full transition-colors ${
              pathname === "/history"
                ? "bg-surface-highlight"
                : "hover:bg-surface-highlight/50 group"
            }`}
          >
            <History
              className={`w-5 h-5 ${
                pathname === "/history"
                  ? "text-text-primary"
                  : "text-text-secondary group-hover:text-text-primary"
              }`}
            />
            <p
              className={`leading-normal font-bold text-sm ${
                pathname === "/history"
                  ? "text-text-primary"
                  : "text-text-secondary group-hover:text-text-primary"
              }`}
            >
              History
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3 cursor-pointer h-12 px-4 py-3 rounded-full hover:bg-surface-highlight/50 transition-colors group">
          <Settings className="text-text-secondary group-hover:text-text-primary w-5 h-5" />
          <p className="text-text-secondary group-hover:text-text-primary leading-normal font-bold text-sm">
            Settings
          </p>
        </div>
      </div>
      <div className="h-px w-full bg-border-color my-2"></div>

      <div className="p-4">
        <h3 className="text-text-secondary tracking-wide uppercase font-bold text-xs leading-4 px-2 mb-4">
          JLPT Level
        </h3>
        <div className="flex flex-wrap gap-2 px-2">
          {jlptLevels.map((level) => (
            <button
              key={level}
              onClick={() => onLevelChange(level)}
              className={`px-4 rounded-full flex items-center justify-center h-8 border transition-colors ${
                selectedLevel === level
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-highlight text-black border-transparent hover:bg-primary hover:text-white hover:border-primary"
              }`}
            >
              <p className="leading-normal font-bold text-xs">{level}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 flex flex-col gap-3">
        <h3 className="text-text-secondary tracking-wide uppercase font-bold text-xs leading-4 px-2 mb-2">
          Display Options
        </h3>
        <div className="p-3 border border-border-color flex bg-white rounded-xl gap-4 justify-between items-center">
          <div className="flex flex-col">
            <p className="text-text-primary font-bold text-sm leading-5">
              Show Furigana
            </p>
          </div>
          <div
            className={`w-10 h-6 flex items-center p-0.5 rounded-full cursor-pointer ${
              displayOptions.showFurigana
                ? "bg-primary"
                : "bg-surface-highlight"
            }`}
            onClick={() => {
              onDisplayOptionsChange({
                ...displayOptions,
                showFurigana: !displayOptions.showFurigana,
              });
            }}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full border border-gray-200 shadow-sm transition-transform duration-200 ease ${
                displayOptions.showFurigana ? "translate-x-4" : "translate-x-0"
              }`}
            ></div>
          </div>
        </div>
        <div className="p-3 border border-border-color flex bg-white rounded-xl gap-4 justify-between items-center">
          <div className="flex flex-col">
            <p className="text-text-primary font-bold text-sm leading-5">
              Show Romaji
            </p>
          </div>
          <div
            className={`w-10 h-6 flex items-center p-0.5 rounded-full cursor-pointer ${
              displayOptions.showRomaji ? "bg-primary" : "bg-surface-highlight"
            }`}
            onClick={() => {
              onDisplayOptionsChange({
                ...displayOptions,
                showRomaji: !displayOptions.showRomaji,
              });
            }}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full border border-gray-200 shadow-sm transition-transform duration-200 ease ${
                displayOptions.showRomaji ? "translate-x-4" : "translate-x-0"
              }`}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4">
        <div className="p-3 bg-white border border-border-color flex gap-3 items-center rounded-xl">
          <div className="text-white font-bold bg-text-primary rounded-full flex items-center justify-center w-10 h-10">
            JD
          </div>
          <div className="flex flex-col">
            <p className="text-text-primary font-bold text-sm leading-5">
              Jane Doe
            </p>
            <p className="text-text-secondary text-xs leading-4">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
