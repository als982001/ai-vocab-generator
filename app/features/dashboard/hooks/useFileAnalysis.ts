import { useEffect, useRef, useState } from "react";

import { toast } from "sonner";
import { useSaveAnalysis } from "~/features/dashboard/hooks/useSaveAnalysis";
import { getAnalysisErrorMessage } from "~/features/dashboard/utils/analysisErrorMessage";
import { analyzeDocument } from "~/services/gemini";
import type { IUploadedFile, IWord, Language } from "~/types";

export function useFileAnalysis({ language }: { language: Language }) {
  const { mutate: saveAnalysis } = useSaveAnalysis();

  const [uploadedFile, setUploadedFile] = useState<IUploadedFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [words, setWords] = useState<IWord[]>([]);
  // 스트리밍 중 지금까지 완성된 단어 (결과 패널 표시 전용, 저장·다운로드·오버레이에는 쓰지 않음)
  const [provisionalWords, setProvisionalWords] = useState<IWord[]>([]);
  const [enableResultAnimation, setEnableResultAnimation] = useState(true);

  const isMountedRef = useRef(true);
  // 마지막 요청 번호. 응답이 도착했을 때 이 번호가 아니면 stale(교체·제거된) 요청이다
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true; // Strict Mode: 1차 cleanup 후 2차 mount에서 다시 true로

    return () => {
      isMountedRef.current = false;

      // 페이지를 떠나면 진행 중인 분석 요청도 끊는다
      abortControllerRef.current?.abort();
    };
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
    // 새 파일이든 제거든 진행 중인 이전 요청은 취소한다
    abortControllerRef.current?.abort();

    requestIdRef.current += 1;

    const requestId = requestIdRef.current;

    setUploadedFile(uploadedNewFile);

    // 파일이 제거되면 상태 초기화
    if (!uploadedNewFile) {
      abortControllerRef.current = null;

      setIsAnalyzing(false);
      setWords([]);
      setProvisionalWords([]);
      return;
    }

    const abortController = new AbortController();

    abortControllerRef.current = abortController;

    setIsAnalyzing(true);
    setWords([]); // 분석 시작 시 결과 초기화
    setProvisionalWords([]);
    setEnableResultAnimation(true);

    // 이 요청의 결과를 아직 화면에 반영해도 되는지 (unmount·교체·제거되지 않았는지)
    const checkIsCurrentRequest = () => {
      return {
        isCurrent:
          isMountedRef.current &&
          requestIdRef.current === requestId &&
          !abortController.signal.aborted,
      };
    };

    try {
      const { words: analyzedWords } = await analyzeDocument({
        file: uploadedNewFile.file,
        language,
        signal: abortController.signal,
        onProgress: ({ words: nextProvisionalWords }) => {
          if (!checkIsCurrentRequest().isCurrent) return;

          setProvisionalWords(nextProvisionalWords);
        },
      });

      if (!checkIsCurrentRequest().isCurrent) return;

      setWords(analyzedWords);
      setProvisionalWords([]);
      setIsAnalyzing(false);

      if (analyzedWords.length > 0) {
        toast.success("분석을 성공했습니다.");

        // 저장은 끝까지 받고 검증까지 통과한 최종 결과에서만 한 번
        saveAnalysis({
          words: analyzedWords,
          imageName: uploadedNewFile.file.name,
          language,
        });
      } else {
        toast.info("단어를 찾지 못했습니다.");
      }
    } catch (error) {
      // 취소·교체된 요청의 실패는 사용자에게 알리지 않는다
      if (!checkIsCurrentRequest().isCurrent) return;

      console.error(error);

      setProvisionalWords([]);
      setWords([]);
      setIsAnalyzing(false);

      toast.error(getAnalysisErrorMessage({ error }).message);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  return {
    uploadedFile,
    isAnalyzing,
    words,
    provisionalWords,
    enableResultAnimation,
    setEnableResultAnimation,
    handleFileUpload,
  };
}
