import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Sidebar } from "~/components/shared/Sidebar";
import type { IDisplayOptions, JlptLevel } from "~/types";

interface ISidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLevels: JlptLevel[];
  onLevelToggle: (level: JlptLevel) => void;
  displayOptions: IDisplayOptions;
  onDisplayOptionsChange: (options: IDisplayOptions) => void;
}

export function SidebarDrawer({
  isOpen,
  onClose,
  selectedLevels,
  onLevelToggle,
  displayOptions,
  onDisplayOptionsChange,
}: ISidebarDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* 배경 오버레이 */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* 사이드바 패널 */}
          <motion.div
            className="absolute top-0 left-0 h-full"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                selectedLevels={selectedLevels}
                onLevelToggle={onLevelToggle}
                displayOptions={displayOptions}
                onDisplayOptionsChange={onDisplayOptionsChange}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
