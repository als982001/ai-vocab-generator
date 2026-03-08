import type { IWord } from "~/types";

const BOX_COORDINATE_SCALE = 1000;

interface IBoundingBoxOverlayProps {
  words: IWord[];
  hoveredWord: string | null;
  onHover: (word: string | null) => void;
  onClick: (word: string) => void;
  currentPage?: number;
}

export function BoundingBoxOverlay({
  words,
  hoveredWord,
  onHover,
  onClick,
  currentPage,
}: IBoundingBoxOverlayProps) {
  const visibleWords =
    currentPage !== undefined
      ? words.filter((word) => word.page === currentPage)
      : words;

  return (
    <div className="absolute inset-0">
      {visibleWords.map((word) => {
        if (!word.box_2d || word.box_2d.length !== 4) return null;

        const [ymin, xmin, ymax, xmax] = word.box_2d;
        const isHovered = hoveredWord === word.word;

        // 동적 퍼센트 좌표값은 Tailwind 임의값으로 처리 불가 → 인라인 스타일 사용
        const style = {
          top: `${(ymin / BOX_COORDINATE_SCALE) * 100}%`,
          left: `${(xmin / BOX_COORDINATE_SCALE) * 100}%`,
          width: `${((xmax - xmin) / BOX_COORDINATE_SCALE) * 100}%`,
          height: `${((ymax - ymin) / BOX_COORDINATE_SCALE) * 100}%`,
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
  );
}
