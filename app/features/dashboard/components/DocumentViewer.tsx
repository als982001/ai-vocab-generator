import { Suspense, lazy } from "react";

import type { IUploadedImage, IWord } from "~/types";

import { ImageOverlay } from "./ImageOverlay";

const PdfViewer = lazy(() =>
  import("./PdfViewer").then((mod) => ({ default: mod.PdfViewer }))
);

interface IDocumentViewerProps {
  uploadedImage: IUploadedImage;
  words: IWord[];
  hoveredWord: string | null;
  onHover: (word: string | null) => void;
  onWordClick: (word: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  onNumPagesLoad: (numPages: number) => void;
}

export function DocumentViewer({
  uploadedImage,
  words,
  hoveredWord,
  onHover,
  onWordClick,
  currentPage,
  onPageChange,
  onNumPagesLoad,
}: IDocumentViewerProps) {
  if (uploadedImage.fileType === "image") {
    return (
      <ImageOverlay
        imageSrc={uploadedImage.preview}
        words={words}
        hoveredWord={hoveredWord}
        onHover={onHover}
        onClick={onWordClick}
      />
    );
  }

  if (uploadedImage.fileType === "pdf") {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8 text-gray-500 text-sm">
            PDF 로딩 중...
          </div>
        }
      >
        <PdfViewer
          file={uploadedImage.file}
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
