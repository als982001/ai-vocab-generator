import { useState } from "react";

import { toast } from "sonner";
import { ImageUploader } from "~/features/dashboard/components/ImageUploader";
import { ResultPanel } from "~/features/dashboard/components/ResultPanel";
import { Sidebar } from "~/features/dashboard/components/Sidebar";
import { downloadWordsAsTxt } from "~/features/dashboard/utils/download";
import { analyzeImage } from "~/services/gemini";
import { saveAnalysis } from "~/services/localStorage";
import type {
  IDisplayOptions,
  IUploadedImage,
  IWord,
  JlptLevel,
} from "~/types";

export default function HomePage() {
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>("N3");
  const [displayOptions, setDisplayOptions] = useState<IDisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });
  const [uploadedImage, setUploadedImage] = useState<IUploadedImage | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [words, setWords] = useState<IWord[]>([]);

  const handleDownloadTxt = () => {
    downloadWordsAsTxt(words);
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

        toast.success("분석을 성공했습니다.");

        // 로컬 스토리지에 분석 결과 저장
        saveAnalysis(analyzedWords, image.file.name);
      } catch {
        alert("이미지 분석에 실패했습니다. 다시 시도해주세요.");
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
        <ResultPanel
          words={words}
          displayOptions={displayOptions}
          onDownload={handleDownloadTxt}
        />
      </div>
    </div>
  );
}
