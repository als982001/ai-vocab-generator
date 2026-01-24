import { useRef, useState } from "react";

import type { IWord } from "~/types";

interface IImageOverlayProps {
  imageSrc: string;
  words: IWord[];
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
}

interface IImageSize {
  width: number;
  height: number;
}

export function ImageOverlay({
  imageSrc,
  words,
  hoveredIndex,
  onHover,
  onClick,
}: IImageOverlayProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState<IImageSize>({
    width: 0,
    height: 0,
  });

  const handleImageLoad = () => {
    if (imgRef.current) {
      setImageSize({
        width: imgRef.current.offsetWidth,
        height: imgRef.current.offsetHeight,
      });
    }
  };

  return (
    <div className="relative inline-block">
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Uploaded preview"
        className="max-w-full max-h-[500px] object-contain rounded-lg"
        onLoad={handleImageLoad}
      />

      {imageSize.width > 0 && imageSize.height > 0 && (
        <div
          className="absolute top-0 left-0"
          style={{ width: imageSize.width, height: imageSize.height }}
        >
          {words.map((word, index) => {
            if (!word.box_2d || word.box_2d.length !== 4) return null;

            const [ymin, xmin, ymax, xmax] = word.box_2d;
            const isHovered = hoveredIndex === index;

            const style = {
              top: `${ymin / 10}%`,
              left: `${xmin / 10}%`,
              width: `${(xmax - xmin) / 10}%`,
              height: `${(ymax - ymin) / 10}%`,
            };

            return (
              <div
                key={index}
                style={style}
                className={`absolute border-2 cursor-pointer transition-all duration-200 ${
                  isHovered
                    ? "border-red-500 bg-red-500/20"
                    : "border-transparent hover:border-red-300"
                }`}
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onClick(index)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
