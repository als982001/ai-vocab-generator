import { useRef } from "react";

import type { IWord } from "~/types";

export function useImageScroll(words: IWord[]) {
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleWordCardClick = (wordStr: string) => {
    // 모바일에서만 동작 (768px 미만)
    if (window.innerWidth >= 768) return;

    const word = words.find((w) => w.word === wordStr);

    if (!word?.box_2d || word.box_2d.length !== 4) return;

    const imageContainer = imageContainerRef.current;

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

  return { imageContainerRef, handleWordCardClick };
}
