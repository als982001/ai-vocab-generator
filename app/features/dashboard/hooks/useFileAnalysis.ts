import { useEffect, useState } from "react";

import { toast } from "sonner";
import { useSaveAnalysis } from "~/features/dashboard/hooks/useSaveAnalysis";
import { analyzeDocument } from "~/services/gemini";
import type { IUploadedFile, IWord } from "~/types";

export function useFileAnalysis() {
  const { mutate: saveAnalysis } = useSaveAnalysis();

  const [uploadedFile, setUploadedFile] = useState<IUploadedFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [words, setWords] = useState<IWord[]>([]);
  const [enableResultAnimation, setEnableResultAnimation] = useState(true);

  // 컴포넌트 unmount 시 마지막 파일의 preview URL 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (uploadedFile?.preview) {
        URL.revokeObjectURL(uploadedFile.preview);
      }
    };
  }, [uploadedFile]);

  const handleFileUpload = async (uploadedNewFile: IUploadedFile | null) => {
    setUploadedFile(uploadedNewFile);

    // 파일이 업로드되면 분석 시작
    if (uploadedNewFile) {
      setIsAnalyzing(true);
      setWords([]); // 분석 시작 시 결과 초기화

      try {
        // 실제 Gemini API 호출
        const analyzedWords = await analyzeDocument(uploadedNewFile.file);

        setWords(analyzedWords);
        setEnableResultAnimation(true);

        if (analyzedWords.length > 0) {
          toast.success("분석을 성공했습니다.");

          // Supabase에 분석 결과 저장
          saveAnalysis({
            words: analyzedWords,
            imageName: uploadedNewFile.file.name,
          });
        } else {
          toast.info("단어를 찾지 못했습니다.");
        }
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
