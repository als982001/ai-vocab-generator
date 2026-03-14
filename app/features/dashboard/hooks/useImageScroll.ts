import { useRef } from "react";

import type { IWord } from "~/types";

export function useImageScroll(
  words: IWord[],
  options?: {
    fileType?: "image" | "pdf";
    onPageChange?: (page: number) => void;
  }
) {
  const fileContainerRef = useRef<HTMLDivElement>(null);

  const handleWordCardClick = (wordStr: string) => {
    // 모바일에서만 동작 (768px 미만)
    if (window.innerWidth >= 768) return;

    const word = words.find((w) => w.word === wordStr);

    if (!word) return;

    // PDF일 때: 해당 단어의 페이지로 이동
    if (options?.fileType === "pdf") {
      if (word.page != null) {
        options.onPageChange?.(word.page);
      }

      return;
    }

    // 이미지일 때: 해당 단어 위치로 스크롤
    if (!word.box_2d || word.box_2d.length !== 4) return;

    const imageContainer = fileContainerRef.current;

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

  return { fileContainerRef, handleWordCardClick };
}
