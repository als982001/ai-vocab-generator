import type { IWord } from "~/types";

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

      <div className="absolute inset-0">
        {words.map((word, index) => {
          if (!word.box_2d || word.box_2d.length !== 4) return null;

          const [ymin, xmin, ymax, xmax] = word.box_2d;
          const isHovered = hoveredWord === word.word;

          const style = {
            top: `${ymin / 10}%`,
            left: `${xmin / 10}%`,
            width: `${(xmax - xmin) / 10}%`,
            height: `${(ymax - ymin) / 10}%`,
          };

          return (
            <div
              key={word.word}
              style={style}
              className={`absolute border-2 cursor-pointer transition-all duration-200 ${
                isHovered
                  ? "border-red-500 bg-red-500/20"
                  : "border-transparent hover:border-red-300"
              }`}
              onMouseEnter={() => onHover(word.word)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onClick(word.word)}
            />
          );
        })}
      </div>
    </div>
  );
}
