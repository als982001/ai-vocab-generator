import { useEffect, useRef, useState } from "react";

const HIGHLIGHT_DURATION_MS = 1500;

export function useHighlightWord() {
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 하이라이트 타이머 cleanup
  useEffect(() => {
    return () => clearTimeout(highlightTimerRef.current);
  }, []);

  const handleWordClick = (wordStr: string) => {
    const element = document.getElementById(`word-card-${wordStr}`);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setHighlightedWord(wordStr);

    clearTimeout(highlightTimerRef.current);

    highlightTimerRef.current = setTimeout(() => {
      setHighlightedWord(null);
    }, HIGHLIGHT_DURATION_MS);
  };

  return { highlightedWord, handleWordClick };
}
