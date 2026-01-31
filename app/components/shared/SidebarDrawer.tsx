import { X } from "lucide-react";

import { Sidebar } from "~/features/dashboard/components/Sidebar";
import type { IDisplayOptions, JlptLevel } from "~/types";

interface ISidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLevel: JlptLevel;
  onLevelChange: (level: JlptLevel) => void;
  displayOptions: IDisplayOptions;
  onDisplayOptionsChange: (options: IDisplayOptions) => void;
}

export function SidebarDrawer({
  isOpen,
  onClose,
  selectedLevel,
  onLevelChange,
  displayOptions,
  onDisplayOptionsChange,
}: ISidebarDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* 사이드바 패널 */}
      <div
        className={`absolute top-0 left-0 h-full transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-surface-highlight hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-text-primary" />
          </button>

          <Sidebar
            selectedLevel={selectedLevel}
            onLevelChange={onLevelChange}
            displayOptions={displayOptions}
            onDisplayOptionsChange={onDisplayOptionsChange}
          />
        </div>
      </div>
    </div>
  );
}
