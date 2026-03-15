import { useRef } from "react";

import type { IWord } from "~/types";

export function useImageScroll(
  words: IWord[],
  options?: {
    fileType?: "image" | "pdf";
    currentPage?: number;
    onPageChange?: (page: number) => void;
  }
) {
  const fileContainerRef = useRef<HTMLDivElement>(null);

  const scrollToWordPosition = (word: IWord) => {
    const container = fileContainerRef.current;

    if (!container || !word.box_2d || word.box_2d.length !== 4) return;

    const [ymin] = word.box_2d;

    // ymin(0~1000)을 실제 픽셀로 변환
    const contentHeight = container.scrollHeight;
    const targetY = (ymin / 1000) * contentHeight;

    // 스크롤 컨테이너의 상단 1/3 위치에 오도록 오프셋 계산
    const containerHeight = container.clientHeight;
    const scrollTarget = targetY - containerHeight / 3;

    container.scrollTo({
      top: scrollTarget,
      behavior: "smooth",
    });
  };

  const handleWordCardClick = (wordStr: string) => {
    const word = words.find((w) => w.word === wordStr);

    if (!word) return;

    // PDF일 때: 해당 단어의 페이지로 이동 + 위치 스크롤
    if (options?.fileType === "pdf") {
      const isSamePage = word.page === options.currentPage;

      if (isSamePage) {
        scrollToWordPosition(word);
      } else if (word.page != null) {
        options.onPageChange?.(word.page);

        // 페이지 전환 후 react-pdf 캔버스 렌더링 대기
        setTimeout(() => {
          scrollToWordPosition(word);
        }, 300);
      }

      return;
    }

    // 모바일에서만 동작 (768px 미만)
    if (window.innerWidth >= 768) return;

    // 이미지일 때: 해당 단어 위치로 스크롤
    scrollToWordPosition(word);
  };

  return { fileContainerRef, handleWordCardClick };
}
