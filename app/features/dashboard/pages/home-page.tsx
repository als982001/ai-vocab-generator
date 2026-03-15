import { useMemo, useState } from "react";

import { motion } from "framer-motion";
import { FloatingActionButton } from "~/components/shared/FloatingActionButton";
import { MobileHeader } from "~/components/shared/MobileHeader";
import { Sidebar } from "~/components/shared/Sidebar";
import { SidebarDrawer } from "~/components/shared/SidebarDrawer";
import { FileUploader } from "~/features/dashboard/components/FileUploader";
import { ResultPanel } from "~/features/dashboard/components/ResultPanel";
import { useFileAnalysis } from "~/features/dashboard/hooks/useFileAnalysis";
import { useHighlightWord } from "~/features/dashboard/hooks/useHighlightWord";
import { useImageScroll } from "~/features/dashboard/hooks/useImageScroll";
import {
  downloadWordsAsCsv,
  downloadWordsAsTxt,
} from "~/features/dashboard/utils/download";
import type { IDisplayOptions, IUploadedFile, JlptLevel } from "~/types";
import { PAGE_TRANSITION, PAGE_TRANSITION_DURATION } from "~/utils/animation";

export default function HomePage() {
  const {
    uploadedFile,
    isAnalyzing,
    words,
    enableResultAnimation,
    setEnableResultAnimation,
    handleFileUpload,
  } = useFileAnalysis();

  const { highlightedWord, handleWordClick } = useHighlightWord();

  const [selectedLevels, setSelectedLevels] = useState<JlptLevel[]>([]);
  const [displayOptions, setDisplayOptions] = useState<IDisplayOptions>({
    showFurigana: true,
  });
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_numPages, setNumPages] = useState(0); // 추후 "3/10 페이지" 같은 총 페이지 수 표시에 활용 예정

  const { fileContainerRef, handleWordCardClick, handlePageRendered } =
    useImageScroll(words, {
      fileType: uploadedFile?.fileType,
      currentPage,
      onPageChange: setCurrentPage,
    });

  const handleFileUploadWithReset = (file: IUploadedFile | null) => {
    setCurrentPage(1);
    setNumPages(0);

    handleFileUpload(file);
  };

  const handleDownloadTxt = () => {
    downloadWordsAsTxt(words);
  };

  const handleDownloadCsv = () => {
    downloadWordsAsCsv(words);
  };

  const handleLevelToggle = (level: JlptLevel) => {
    setEnableResultAnimation(false);

    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const filteredWords = useMemo(
    () =>
      selectedLevels.length === 0
        ? words
        : words.filter((word) => selectedLevels.includes(word.level)),
    [words, selectedLevels]
  );

  return (
    <div className="bg-background-dark text-text-primary font-display h-screen w-full overflow-hidden flex flex-col">
      <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />

      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedLevels={selectedLevels}
        onLevelToggle={handleLevelToggle}
        displayOptions={displayOptions}
        onDisplayOptionsChange={setDisplayOptions}
      />

      <div className="flex flex-col md:flex-row flex-1 h-full w-full overflow-hidden">
        <Sidebar
          selectedLevels={selectedLevels}
          onLevelToggle={handleLevelToggle}
          displayOptions={displayOptions}
          onDisplayOptionsChange={setDisplayOptions}
          className="hidden md:flex"
        />
        <motion.div
          className="flex flex-col md:flex-row flex-1 overflow-hidden"
          variants={PAGE_TRANSITION}
          initial="initial"
          animate="animate"
          transition={{ duration: PAGE_TRANSITION_DURATION }}
        >
          <FileUploader
            uploadedFile={uploadedFile}
            onFileUpload={handleFileUploadWithReset}
            isAnalyzing={isAnalyzing}
            words={words}
            hoveredWord={hoveredWord}
            onHover={setHoveredWord}
            onWordClick={handleWordClick}
            fileContainerRef={fileContainerRef}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onNumPagesLoad={setNumPages}
            onPageRendered={handlePageRendered}
          />
          <ResultPanel
            words={filteredWords}
            displayOptions={displayOptions}
            onDownloadTxt={handleDownloadTxt}
            onDownloadCsv={handleDownloadCsv}
            hoveredWord={hoveredWord}
            onHover={setHoveredWord}
            onWordCardClick={handleWordCardClick}
            highlightedWord={highlightedWord}
            enableAnimation={enableResultAnimation}
          />
        </motion.div>
      </div>

      <FloatingActionButton
        onFileUpload={handleFileUploadWithReset}
        onDownloadTxt={handleDownloadTxt}
        onDownloadCsv={handleDownloadCsv}
        wordCount={words.length}
      />
    </div>
  );
}
