import { useMemo, useState } from "react";

import { motion } from "framer-motion";
import { FloatingActionButton } from "~/components/shared/FloatingActionButton";
import { MobileHeader } from "~/components/shared/MobileHeader";
import { Sidebar } from "~/components/shared/Sidebar";
import { SidebarDrawer } from "~/components/shared/SidebarDrawer";
import { ImageUploader } from "~/features/dashboard/components/ImageUploader";
import { ResultPanel } from "~/features/dashboard/components/ResultPanel";
import { useHighlightWord } from "~/features/dashboard/hooks/useHighlightWord";
import { useImageAnalysis } from "~/features/dashboard/hooks/useImageAnalysis";
import { useImageScroll } from "~/features/dashboard/hooks/useImageScroll";
import {
  downloadWordsAsCsv,
  downloadWordsAsTxt,
} from "~/features/dashboard/utils/download";
import type { IDisplayOptions, JlptLevel } from "~/types";
import { PAGE_TRANSITION, PAGE_TRANSITION_DURATION } from "~/utils/animation";

export default function HomePage() {
  const {
    uploadedImage,
    isAnalyzing,
    words,
    enableResultAnimation,
    setEnableResultAnimation,
    handleImageUpload,
  } = useImageAnalysis();

  const { highlightedWord, handleWordClick } = useHighlightWord();
  const { imageContainerRef, handleWordCardClick } = useImageScroll(words);

  const [selectedLevels, setSelectedLevels] = useState<JlptLevel[]>([]);
  const [displayOptions, setDisplayOptions] = useState<IDisplayOptions>({
    showFurigana: true,
  });
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          <ImageUploader
            uploadedImage={uploadedImage}
            onImageUpload={handleImageUpload}
            isAnalyzing={isAnalyzing}
            words={words}
            hoveredWord={hoveredWord}
            onHover={setHoveredWord}
            onWordClick={handleWordClick}
            imageContainerRef={imageContainerRef}
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
        onImageUpload={handleImageUpload}
        onDownloadTxt={handleDownloadTxt}
        onDownloadCsv={handleDownloadCsv}
        wordCount={words.length}
      />
    </div>
  );
}
