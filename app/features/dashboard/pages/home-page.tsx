import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { FloatingActionButton } from "~/components/shared/FloatingActionButton";
import { MobileHeader } from "~/components/shared/MobileHeader";
import { SidebarDrawer } from "~/components/shared/SidebarDrawer";
import { ImageUploader } from "~/features/dashboard/components/ImageUploader";
import { ResultPanel } from "~/features/dashboard/components/ResultPanel";
import { Sidebar } from "~/features/dashboard/components/Sidebar";
import {
  downloadWordsAsCsv,
  downloadWordsAsTxt,
} from "~/features/dashboard/utils/download";
import { analyzeImage } from "~/services/gemini";
import { saveAnalysis } from "~/services/localStorage";
import type {
  IDisplayOptions,
  IUploadedImage,
  IWord,
  JlptLevel,
} from "~/types";
import { PAGE_TRANSITION, PAGE_TRANSITION_DURATION } from "~/utils/animation";

// 샘플 데이터 (반응형 테스트용)
import sampleResponse from "../../../../mockDatas/sample_response_02.json";

const SAMPLE_IMAGE_PATH = "/mockDatas/sample_image_02.png";
const USE_SAMPLE_DATA = true; // 테스트 완료 후 false로 변경

export default function HomePage() {
  const [selectedLevels, setSelectedLevels] = useState<JlptLevel[]>([]);
  const [displayOptions, setDisplayOptions] = useState<IDisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });
  const [uploadedImage, setUploadedImage] = useState<IUploadedImage | null>(
    USE_SAMPLE_DATA
      ? { file: new File([], "sample_image.png"), preview: SAMPLE_IMAGE_PATH }
      : null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [words, setWords] = useState<IWord[]>(
    USE_SAMPLE_DATA ? (sampleResponse as IWord[]) : []
  );
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [enableResultAnimation, setEnableResultAnimation] = useState(true);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 컴포넌트 unmount 시 마지막 이미지의 preview URL 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (uploadedImage?.preview) {
        URL.revokeObjectURL(uploadedImage.preview);
      }
    };
  }, [uploadedImage]);

  // 하이라이트 타이머 cleanup
  useEffect(() => {
    return () => clearTimeout(highlightTimerRef.current);
  }, []);

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

  const filteredWords =
    selectedLevels.length === 0
      ? words
      : words.filter((word) => selectedLevels.includes(word.level));

  const handleWordClick = (wordStr: string) => {
    const element = document.getElementById(`word-card-${wordStr}`);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setHighlightedWord(wordStr);

    clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedWord(null);
    }, 1500);
  };

  const handleWordCardClick = (wordStr: string) => {
    // 모바일에서만 동작 (768px 미만)
    if (window.innerWidth >= 768) return;

    const word = words.find((w) => w.word === wordStr);

    if (!word?.box_2d || word.box_2d.length !== 4) return;

    const imageContainer = imageContainerRef.current;

    if (!imageContainer) return;

    const [ymin] = word.box_2d;

    // ymin(0~1000)을 실제 픽셀로 변환
    const imageHeight = imageContainer.scrollHeight;
    const targetY = (ymin / 1000) * imageHeight;

    // 스크롤 컨테이너의 상단 1/3 위치에 오도록 오프셋 계산
    const containerHeight = imageContainer.clientHeight;
    const scrollTarget = targetY - containerHeight / 3;

    imageContainer.scrollTo({
      top: scrollTarget,
      behavior: "smooth",
    });
  };

  const handleImageUpload = async (image: IUploadedImage | null) => {
    // 이전 이미지의 preview URL 정리
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }

    setUploadedImage(image);

    // 이미지가 업로드되면 분석 시작
    if (image) {
      setIsAnalyzing(true);
      setWords([]); // 분석 시작 시 결과 초기화

      try {
        // 실제 Gemini API 호출
        const analyzedWords = await analyzeImage(image.file);

        setWords(analyzedWords);
        setEnableResultAnimation(true);

        toast.success("분석을 성공했습니다.");

        // 로컬 스토리지에 분석 결과 저장
        saveAnalysis(analyzedWords, image.file.name);
      } catch (error) {
        console.error(error);
        toast.error("이미지 분석에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // 이미지가 제거되면 상태 초기화
      setIsAnalyzing(false);
      setWords([]);
    }
  };

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
