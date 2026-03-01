import { useEffect, useState } from "react";

import { toast } from "sonner";
import { useSaveAnalysis } from "~/features/dashboard/hooks/useSaveAnalysis";
import { analyzeImage } from "~/services/gemini";
import type { IUploadedImage, IWord } from "~/types";

export function useImageAnalysis() {
  const { mutate: saveAnalysis } = useSaveAnalysis();

  const [uploadedImage, setUploadedImage] = useState<IUploadedImage | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [words, setWords] = useState<IWord[]>([]);
  const [enableResultAnimation, setEnableResultAnimation] = useState(true);

  // 컴포넌트 unmount 시 마지막 이미지의 preview URL 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (uploadedImage?.preview) {
        URL.revokeObjectURL(uploadedImage.preview);
      }
    };
  }, [uploadedImage]);

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

        // Supabase에 분석 결과 저장
        saveAnalysis({ words: analyzedWords, imageName: image.file.name });
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

  return {
    uploadedImage,
    isAnalyzing,
    words,
    enableResultAnimation,
    setEnableResultAnimation,
    handleImageUpload,
  };
}
