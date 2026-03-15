import type { IWord } from "~/types";

import { BoundingBoxOverlay } from "./BoundingBoxOverlay";

interface IImageOverlayProps {
  imageSrc: string;
  words: IWord[];
  hoveredWord: string | null;
  onHover: (word: string | null) => void;
  onClick: (word: string) => void;
}

export function ImageOverlay({
  imageSrc,
  words,
  hoveredWord,
  onHover,
  onClick,
}: IImageOverlayProps) {
  return (
    <div className="relative inline-block">
      <img
        src={imageSrc}
        alt="Uploaded preview"
        className="max-w-full max-h-[500px] object-contain rounded-lg"
      />

      <BoundingBoxOverlay
        words={words}
        hoveredWord={hoveredWord}
        onHover={onHover}
        onClick={onClick}
      />
    </div>
  );
}
