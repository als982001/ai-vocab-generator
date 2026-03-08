import { ChevronLeft, ChevronRight } from "lucide-react";

interface IPdfPaginationProps {
  currentPage: number;
  numPages: number;
  onPageChange: (page: number) => void;
}

export function PdfPagination({
  currentPage,
  numPages,
  onPageChange,
}: IPdfPaginationProps) {
  if (numPages <= 0) return null;

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= numPages;

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        aria-label="이전 페이지"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-all
          ${
            isFirstPage
              ? "opacity-50 cursor-not-allowed text-gray-400"
              : "text-text-primary hover:bg-gray-100 hover:text-primary"
          }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>이전</span>
      </button>

      <span className="text-sm text-text-primary font-medium tabular-nums">
        {currentPage} / {numPages}
      </span>

      <button
        aria-label="다음 페이지"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-all
          ${
            isLastPage
              ? "opacity-50 cursor-not-allowed text-gray-400"
              : "text-text-primary hover:bg-gray-100 hover:text-primary"
          }`}
      >
        <span>다음</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
