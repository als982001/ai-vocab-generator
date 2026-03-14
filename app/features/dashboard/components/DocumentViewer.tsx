import { Suspense, lazy } from "react";

import type { IUploadedFile, IWord } from "~/types";

import { ImageOverlay } from "./ImageOverlay";

const PdfViewer = lazy(() =>
  import("./PdfViewer").then((mod) => ({ default: mod.PdfViewer }))
);

interface IDocumentViewerProps {
  uploadedFile: IUploadedFile;
  words: IWord[];
  hoveredWord: string | null;
  onHover: (word: string | null) => void;
  onWordClick: (word: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  onNumPagesLoad: (numPages: number) => void;
}

export function DocumentViewer({
  uploadedFile,
  words,
  hoveredWord,
  onHover,
  onWordClick,
  currentPage,
  onPageChange,
  onNumPagesLoad,
}: IDocumentViewerProps) {
  if (uploadedFile.fileType === "image") {
    return (
      <ImageOverlay
        imageSrc={uploadedFile.preview}
        words={words}
        hoveredWord={hoveredWord}
        onHover={onHover}
        onClick={onWordClick}
      />
    );
  }

  if (uploadedFile.fileType === "pdf") {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8 text-gray-500 text-sm">
            PDF 로딩 중...
          </div>
        }
      >
        <PdfViewer
          file={uploadedFile.file}
          words={words}
          hoveredWord={hoveredWord}
          onHover={onHover}
          onClick={onWordClick}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onNumPagesLoad={onNumPagesLoad}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 text-red-500 text-sm">
      유효하지 않은 파일 형식입니다.
    </div>
  );
}
