import { useState } from "react";

import { ImageUploader } from "~/features/dashboard/components/ImageUploader";
import { ResultPanel } from "~/features/dashboard/components/ResultPanel";
import { Sidebar } from "~/features/dashboard/components/Sidebar";
import { analyzeImage } from "~/services/gemini";
import type { DisplayOptions, JlptLevel, UploadedImage, Word } from "~/types";

const TEMP_WORDS: Word[] = [
  {
    word: "被疑者",
    reading: "ひぎしゃ",
    meaning: "피의자",
    level: "N1",
  },
  {
    word: "かたくなに",
    reading: "かたくなに",
    meaning: "완강하게, 고집스럽게",
    level: "N2",
  },
  {
    word: "供述",
    reading: "きょうじゅつ",
    meaning: "진술, 공술",
    level: "N1",
  },
  {
    word: "拒む",
    reading: "こばむ",
    meaning: "거부하다, 물리치다",
    level: "N2",
  },
  {
    word: "営む",
    reading: "いとなむ",
    meaning: "경영하다, 운영하다, 영위하다",
    level: "N2",
  },
  {
    word: "歩む",
    reading: "あゆむ",
    meaning: "걷다, 나아가다",
    level: "N3",
  },
  {
    word: "慎む",
    reading: "つつしむ",
    meaning: "삼가다, 조심하다",
    level: "N2",
  },
];

export default function HomePage() {
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>("N3");
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [words, setWords] = useState<Word[]>(TEMP_WORDS);

  const handleDownloadTxt = () => {
    if (words.length === 0) return;

    // 현재 날짜 생성
    const today = new Date().toLocaleDateString("ko-KR");

    // 1. 파일 내용 생성
    const header = `================================\nSnap-Voca 단어장 (${today})\n================================\n\n`;
    const wordList = words
      .map(
        (word, index) =>
          `${index + 1}. ${word.word} (${word.reading}) : ${word.meaning} [${word.level}]`
      )
      .join("\n");
    const content = header + wordList;

    // 2. [핵심] 문자열을 확실한 UTF-8 바이트 배열로 변환
    const encoder = new TextEncoder();
    const rawData = encoder.encode(content);

    // 3. [핵심] UTF-8임을 알리는 3바이트 BOM(Byte Order Mark) 강제 추가
    // (0xEF, 0xBB, 0xBF 이 세 개의 바이트가 파일 맨 앞에 있으면 무조건 UTF-8로 인식함)
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);

    // 4. BOM과 데이터를 합쳐서 Blob 생성
    const blob = new Blob([bom, rawData], { type: "text/plain;charset=utf-8" });

    // 5. 다운로드 실행
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
