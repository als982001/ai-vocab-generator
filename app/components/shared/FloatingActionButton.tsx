import { useEffect, useRef, useState } from "react";

import { FileSpreadsheet, FileText, ImagePlus, Plus } from "lucide-react";
import type { IUploadedImage } from "~/types";

interface IFloatingActionButtonProps {
  onImageUpload?: (image: IUploadedImage) => void;
  onDownloadTxt: () => void;
  onDownloadCsv: () => void;
  wordCount: number;
}

export function FloatingActionButton({
  onImageUpload,
  onDownloadTxt,
  onDownloadCsv,
  wordCount,
}: IFloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  // mousedown 사용 이유: click보다 빠른 반응성 제공 + 버블링 순서 문제 방지
  // 참고: mousedown은 우클릭에도 반응하므로, 필요시 event.button === 0 체크 추가
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && onImageUpload) {
      const preview = URL.createObjectURL(file);
      onImageUpload({ file, preview });
    }

    // Reset input so same file can be selected again
    e.target.value = "";
    setIsOpen(false);
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleDownloadTxtClick = () => {
    onDownloadTxt();
    setIsOpen(false);
  };

  const handleDownloadCsvClick = () => {
    onDownloadCsv();
    setIsOpen(false);
  };

  const isDownloadDisabled = wordCount === 0;
  const menuButtonClass =
    "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white";

  return (
    <div ref={containerRef} className="md:hidden fixed bottom-8 right-6 z-50">
      {onImageUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      {/* Menu (위로 열림) */}
      {isOpen && (
        <div className="absolute bottom-full mb-3 right-0 w-44 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
          {onImageUpload && (
            <button onClick={handleUploadClick} className={menuButtonClass}>
              <ImagePlus className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">
                이미지 업로드
              </span>
            </button>
          )}
          <button
            onClick={handleDownloadTxtClick}
            disabled={isDownloadDisabled}
            className={menuButtonClass}
          >
            <FileText className="w-5 h-5 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">
              TXT 다운로드
            </span>
          </button>
          <button
            onClick={handleDownloadCsvClick}
            disabled={isDownloadDisabled}
            className={menuButtonClass}
          >
            <FileSpreadsheet className="w-5 h-5 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">
              CSV 다운로드
            </span>
          </button>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        aria-label="메뉴 열기"
      >
        <Plus
          className={`w-6 h-6 transition-transform ${isOpen ? "rotate-45" : ""}`}
        />
      </button>
    </div>
  );
}
