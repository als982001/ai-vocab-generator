import type { SavedAnalysis, Word } from "~/types";

const STORAGE_KEY = "snap-voca-history";

// 로컬 스토리지에 분석 결과 저장
export function saveAnalysis(words: Word[], imageName: string): void {
  const history = getAnalysisHistory();

  const newAnalysis: SavedAnalysis = {
    id: crypto.randomUUID(),
    words,
    imageName,
    createdAt: new Date().toISOString(),
  };

  history.unshift(newAnalysis); // 최신 항목을 맨 앞에 추가
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// 로컬 스토리지에서 전체 히스토리 불러오기
export function getAnalysisHistory(): SavedAnalysis[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return [];

    return JSON.parse(stored) as SavedAnalysis[];
  } catch (error) {
    console.error("Failed to load history from localStorage:", error);
    return [];
  }
}

// 특정 분석 결과 삭제
export function deleteAnalysis({
  historyId,
  targetWord,
}: {
  historyId: string;
  targetWord: string;
}): SavedAnalysis[] {
  const history = getAnalysisHistory();

  const filtered = history.flatMap((item) => {
    if (item.words.length === 0) return [];

    if (item.id !== historyId) return [item];

    const filteredWords = item.words.filter(
      (wordInfo) => wordInfo.word !== targetWord
    );

    if (filteredWords.length === 0) return [];

    return [{ ...item, words: filteredWords }];
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  return filtered;
}

// 전체 히스토리 삭제
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
