import type { IWord } from "~/types";

interface IImageOverlayProps {
  imageSrc: string;
  words: IWord[];
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
}

export function ImageOverlay({
  imageSrc,
  words,
  hoveredIndex,
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

      <div className="absolute inset-0">
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
    </div>
  );
}
