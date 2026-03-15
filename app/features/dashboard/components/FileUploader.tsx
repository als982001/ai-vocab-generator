import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";

import { useDropzone } from "react-dropzone";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, CloudUpload, HelpCircle, Loader2, X } from "lucide-react";
import type { IUploadedFile, IWord } from "~/types";

import { DocumentViewer } from "./DocumentViewer";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const LOADING_MESSAGE_INTERVAL_MS = 3000;

const LOADING_MESSAGES = [
  "이미지 분석 중...",
  "단어를 추출하는 중...",
  "거의 다 됐어요!",
];

interface IFileUploaderProps {
  uploadedFile: IUploadedFile | null;
  onFileUpload: (file: IUploadedFile | null) => void;
  isAnalyzing: boolean;
  words: IWord[];
  hoveredWord: string | null;
  onHover: (word: string | null) => void;
  onWordClick: (word: string) => void;
  fileContainerRef?: RefObject<HTMLDivElement | null>;
  currentPage: number;
  onPageChange: (page: number) => void;
  onNumPagesLoad: (numPages: number) => void;
  onPageRendered?: () => void;
}

export function FileUploader({
  uploadedFile,
  onFileUpload,
  isAnalyzing,
  words,
  hoveredWord,
  onHover,
  onWordClick,
  fileContainerRef,
  currentPage,
  onPageChange,
  onNumPagesLoad,
  onPageRendered,
}: IFileUploaderProps) {
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) return;

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, LOADING_MESSAGE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      setLoadingMessageIndex(0);
    };
  }, [isAnalyzing]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const preview = URL.createObjectURL(file);
        const fileType = file.type === "application/pdf" ? "pdf" : "image";

        onFileUpload({ file, preview, fileType });
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
  });

  const handleRemoveImage = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    onFileUpload(null);
  };

  return (
    <main className="h-[45%] md:h-auto md:flex-1 flex flex-col bg-gray-50 relative overflow-hidden min-w-0 shrink-0 md:shrink">
      <div className="h-16 hidden md:flex items-center justify-between px-8 bg-white shrink-0 shadow-sm">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <CloudUpload className="w-4 h-4" />
          <span>/</span>
          <span className="text-text-primary font-medium">Upload</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-text-secondary hover:text-primary transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="text-text-secondary hover:text-primary transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-y-auto bg-gray-50">
        <div
          className={`w-full h-full flex flex-col ${
            uploadedFile?.fileType === "pdf"
              ? "max-w-5xl max-h-[calc(100vh-12rem)]"
              : "max-w-3xl max-h-[600px]"
          }`}
        >
          {uploadedFile ? (
            <div
              ref={fileContainerRef}
              className={`flex-1 flex flex-col rounded-2xl bg-white shadow-md relative ${
                isAnalyzing
                  ? "items-center justify-center"
                  : uploadedFile.fileType === "pdf"
                    ? "p-0 overflow-y-auto"
                    : "items-center justify-start md:justify-center gap-6 px-6 py-14 overflow-y-auto md:overflow-hidden"
              }`}
            >
              {!isAnalyzing && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                >
                  <X className="w-5 h-5 text-text-primary" />
                </button>
              )}
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                  <div className="flex flex-col items-center gap-2">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={loadingMessageIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3 }}
                        className="text-text-primary text-xl font-bold"
                      >
                        {LOADING_MESSAGES[loadingMessageIndex]}
                      </motion.p>
                    </AnimatePresence>
                    <p className="text-text-secondary text-sm">
                      잠시만 기다려주세요
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={
                    uploadedFile.fileType === "pdf" ? "flex-1 w-full" : ""
                  }
                >
                  <DocumentViewer
                    uploadedFile={uploadedFile}
                    words={words}
                    hoveredWord={hoveredWord}
                    onHover={onHover}
                    onWordClick={onWordClick}
                    currentPage={currentPage}
                    onPageChange={onPageChange}
                    onNumPagesLoad={onNumPagesLoad}
                    onPageRendered={onPageRendered}
                  />
                  <p className="text-text-secondary text-sm text-center">
                    {uploadedFile.file.name} (
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`flex-1 flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed bg-white shadow-md px-6 py-14 transition-all cursor-pointer group relative overflow-hidden ${
                isDragActive
                  ? "border-primary bg-gray-50 ring-2 ring-primary/30 scale-[1.02]"
                  : "border-gray-300 hover:border-primary"
              }`}
            >
              <input {...getInputProps()} />
              <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="z-10 flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                  <CloudUpload
                    className={`w-10 h-10 ${isDragActive ? "animate-bounce" : ""}`}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-text-primary text-xl font-bold leading-tight tracking-tight text-center">
                    {isDragActive
                      ? "파일을 여기에 놓으세요"
                      : "이미지 또는 PDF를 드래그 앤 드롭하세요"}
                  </p>
                  <p className="text-text-secondary text-sm font-normal text-center">
                    {`JPG, PNG, WEBP, PDF 지원 (최대 ${MAX_FILE_SIZE_MB}MB)`}
                  </p>
                </div>
                <button className="mt-4 flex min-w-[140px] items-center justify-center rounded-full h-11 px-6 bg-primary hover:bg-gray-800 text-white text-sm font-bold tracking-wide transition-all shadow-lg hover:shadow-xl">
                  <span>파일 선택</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
