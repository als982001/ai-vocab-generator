import { useEffect, useRef, useState } from "react";

import {
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

interface IDownloadDropdownProps {
  wordCount: number;
  onDownloadTxt: () => void;
  onDownloadCsv: () => void;
  disabled?: boolean;
}

export function DownloadDropdown({
  wordCount,
  onDownloadTxt,
  onDownloadCsv,
  disabled = false,
}: IDownloadDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  // mousedown 사용 이유: click보다 빠른 반응성 제공 + 버블링 순서 문제 방지
  // 참고: mousedown은 우클릭에도 반응하므로, 필요시 event.button === 0 체크 추가
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const menuItems: { icon: LucideIcon; label: string; onClick: () => void }[] =
    [
      { icon: FileText, label: "TXT로 다운로드", onClick: onDownloadTxt },
      {
        icon: FileSpreadsheet,
        label: "CSV로 다운로드",
        onClick: onDownloadCsv,
      },
    ];

  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Menu (위로 열림) */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {menuItems.map(({ icon: Icon, label, onClick }, index) => (
            <button
              key={label}
              onClick={() => handleMenuItemClick(onClick)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors ${
                index > 0 ? "border-t border-gray-100" : ""
              }`}
            >
              <Icon className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">
                {label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 rounded-full h-12 bg-primary hover:bg-gray-800 text-white text-base font-bold transition-all shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <Download className="w-5 h-5" />
        <span>{`Download ${wordCount} words`}</span>
        <ChevronUp
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
