import { useEffect, useRef, useState } from "react";

import { ChevronUp, Download, FileSpreadsheet, FileText } from "lucide-react";

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

  const handleDownloadTxt = () => {
    onDownloadTxt();
    setIsOpen(false);
  };

  const handleDownloadCsv = () => {
    onDownloadCsv();
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Menu (위로 열림) */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={handleDownloadTxt}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
          >
            <FileText className="w-5 h-5 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">
              TXT로 다운로드
            </span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors border-t border-gray-100"
          >
            <FileSpreadsheet className="w-5 h-5 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">
              CSV로 다운로드
            </span>
          </button>
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
