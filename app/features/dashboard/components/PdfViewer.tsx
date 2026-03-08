import { useEffect, useRef, useState } from "react";

import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import type { IWord } from "~/types";

import { BoundingBoxOverlay } from "./BoundingBoxOverlay";
import { PdfPagination } from "./PdfPagination";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface IPdfViewerProps {
  file: File;
  words: IWord[];
  hoveredWord: string | null;
  onHover: (word: string | null) => void;
  onClick: (word: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  onNumPagesLoad: (numPages: number) => void;
}

export function PdfViewer({
  file,
  words,
  hoveredWord,
  onHover,
  onClick,
  currentPage,
  onPageChange,
  onNumPagesLoad,
}: IPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const handleLoadSuccess = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    onNumPagesLoad(total);
  };

  return (
    <div className="flex flex-col gap-3">
      <div ref={containerRef} className="w-full">
        <Document file={file} onLoadSuccess={handleLoadSuccess}>
          <div className="relative">
            {containerWidth > 0 && (
              <>
                <Page
                  pageNumber={currentPage}
                  width={containerWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                <BoundingBoxOverlay
                  words={words}
                  hoveredWord={hoveredWord}
                  onHover={onHover}
                  onClick={onClick}
                  currentPage={currentPage}
                />
              </>
            )}
          </div>
        </Document>
      </div>

      <PdfPagination
        currentPage={currentPage}
        numPages={numPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
