import { useEffect, useState } from "react";

import { toast } from "sonner";
import { useSaveAnalysis } from "~/features/dashboard/hooks/useSaveAnalysis";
import { analyzeDocument } from "~/services/gemini";
import type { IUploadedFile, IWord } from "~/types";

// TODO: 테스트용 임시 데이터 - PDF 렌더링 확인 후 제거
const MOCK_PDF_WORDS: IWord[] = [
  {
    word: "人",
    reading: "ひと",
    meaning: "사람",
    level: "N5",
    page: 1,
    box_2d: [399, 442, 423, 465],
  },
  {
    word: "体",
    reading: "からだ",
    meaning: "몸",
    level: "N5",
    page: 1,
    box_2d: [418, 439, 443, 467],
  },
  {
    word: "何",
    reading: "なに",
    meaning: "무엇",
    level: "N5",
    page: 1,
    box_2d: [398, 401, 425, 429],
  },
  {
    word: "返せ",
    reading: "かえせ",
    meaning: "돌려줘 (돌려주다)",
    level: "N5",
    page: 1,
    box_2d: [539, 186, 592, 227],
  },
  {
    word: "動ける",
    reading: "うごける",
    meaning: "움직일 수 있다",
    level: "N4",
    page: 1,
    box_2d: [677, 831, 729, 866],
  },
  {
    word: "俺",
    reading: "おれ",
    meaning: "나 (남성형)",
    level: "N3",
    page: 1,
    box_2d: [708, 631, 738, 665],
  },
  {
    word: "男爵",
    reading: "だんしゃく",
    meaning: "남작",
    level: "N1",
    page: 1,
    box_2d: [862, 634, 904, 655],
  },
  {
    word: "抑え込まれる",
    reading: "おさえこまれる",
    meaning: "억눌리다",
    level: "N1",
    page: 1,
    box_2d: [719, 74, 835, 114],
  },
  {
    word: "受肉",
    reading: "じゅにく",
    meaning: "수육 (육체를 얻음)",
    level: "N1",
    page: 2,
    box_2d: [36, 882, 112, 915],
  },
  {
    word: "変身",
    reading: "へんしん",
    meaning: "변신",
    level: "N2",
    page: 2,
    box_2d: [42, 804, 113, 836],
  },
  {
    word: "再開",
    reading: "さいかい",
    meaning: "재개",
    level: "N2",
    page: 2,
    box_2d: [794, 212, 865, 246],
  },
];

export function useFileAnalysis() {
  const { mutate: saveAnalysis } = useSaveAnalysis();

  const [uploadedFile, setUploadedFile] = useState<IUploadedFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [words, setWords] = useState<IWord[]>([]);
  const [enableResultAnimation, setEnableResultAnimation] = useState(true);

  // TODO: 테스트용 초기 상태 세팅 - PDF 렌더링 확인 후 제거
  useEffect(() => {
    const loadTestPdf = async () => {
      const response = await fetch("/test_pdf.pdf");
      const blob = await response.blob();
      const file = new File([blob], "test_pdf.pdf", {
        type: "application/pdf",
      });

      const preview = URL.createObjectURL(blob);

      setUploadedFile({ file, preview, fileType: "pdf" });
      setWords(MOCK_PDF_WORDS);
    };

    loadTestPdf();
  }, []);

  // 컴포넌트 unmount 시 마지막 파일의 preview URL 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (uploadedFile?.preview) {
        URL.revokeObjectURL(uploadedFile.preview);
      }
    };
  }, [uploadedFile]);

  const handleFileUpload = async (uploadedNewFile: IUploadedFile | null) => {
    // 이전 파일의 preview URL 정리
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }

    setUploadedFile(uploadedNewFile);

    // 파일이 업로드되면 분석 시작
    if (uploadedNewFile) {
      setIsAnalyzing(true);
      setWords([]); // 분석 시작 시 결과 초기화

      try {
        // 실제 Gemini API 호출
        const analyzedWords = await analyzeDocument(uploadedNewFile.file);

        console.log("analyzedWords", analyzedWords);

        setWords(analyzedWords);
        setEnableResultAnimation(true);

        toast.success("분석을 성공했습니다.");

        // Supabase에 분석 결과 저장
        saveAnalysis({
          words: analyzedWords,
          imageName: uploadedNewFile.file.name,
        });
      } catch (error) {
        console.error(error);
        toast.error("파일 분석에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // 파일이 제거되면 상태 초기화
      setIsAnalyzing(false);
      setWords([]);
    }
  };

  return {
    uploadedFile,
    isAnalyzing,
    words,
    enableResultAnimation,
    setEnableResultAnimation,
    handleFileUpload,
  };
}
