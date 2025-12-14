import { useEffect, useState } from "react";

import { ImageUploader } from "../components/ImageUploader";
import { ResultPanel } from "../components/ResultPanel";
import { Sidebar } from "../components/Sidebar";
import { MOCK_WORDS } from "../mockData";
import type { DisplayOptions, JlptLevel, UploadedImage, Word } from "../types";

export function DashboardContainer() {
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>("N3");
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [words, setWords] = useState<Word[]>([]);

  // 분석 중일 때 2초 후 완료 처리
  useEffect(() => {
    if (isAnalyzing) {
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setWords(MOCK_WORDS);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAnalyzing]);

  const handleImageUpload = (image: UploadedImage | null) => {
    // 이전 이미지의 preview URL 정리
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }

    setUploadedImage(image);

    // 이미지가 업로드되면 분석 시작
    if (image) {
      setIsAnalyzing(true);
      setWords([]); // 분석 시작 시 결과 초기화
    } else {
      // 이미지가 제거되면 상태 초기화
      setIsAnalyzing(false);
      setWords([]);
    }
  };

  return (
    <div className="bg-gray-50 text-text-primary font-display h-screen w-full overflow-hidden flex flex-col">
      <div className="flex flex-1 h-full w-full overflow-hidden">
        <Sidebar
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          displayOptions={displayOptions}
          onDisplayOptionsChange={setDisplayOptions}
        />
        <ImageUploader
          uploadedImage={uploadedImage}
          onImageUpload={handleImageUpload}
          isAnalyzing={isAnalyzing}
        />
        <ResultPanel words={words} displayOptions={displayOptions} />
      </div>
    </div>
  );
}
