import { useState } from "react";

import { ImageUploader } from "../components/ImageUploader";
import { ResultPanel } from "../components/ResultPanel";
import { Sidebar } from "../components/Sidebar";
import { analyzeImage } from "../services/gemini";
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

  const handleDownloadTxt = () => {
    if (words.length === 0) return;

    // 현재 날짜 생성
    const today = new Date().toLocaleDateString("ko-KR");

    // 텍스트 파일 내용 생성
    const header = `================================\nSnap-Voca 단어장 (${today})\n================================\n\n`;
    const wordList = words
      .map(
        (word, index) =>
          `${index + 1}. ${word.word} (${word.reading}) : ${word.meaning} [${word.level}]`
      )
      .join("\n");
    const content = header + wordList;

    // Blob 생성 및 다운로드 (UTF-8 BOM 추가로 Windows 호환성 확보)
    const blob = new Blob(["\uFEFF" + content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "snap-voca-result.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImageUpload = async (image: UploadedImage | null) => {
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
      } catch (error) {
        console.error("이미지 분석 중 오류가 발생했습니다:", error);
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
        <ResultPanel
          words={words}
          displayOptions={displayOptions}
          onDownload={handleDownloadTxt}
        />
      </div>
    </div>
  );
}
