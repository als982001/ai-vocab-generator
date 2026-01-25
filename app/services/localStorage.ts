import type { ISavedAnalysis, IWord } from "~/types";

const STORAGE_KEY = "snap-voca-history";

// 로컬 스토리지에 분석 결과 저장
export function saveAnalysis(words: IWord[], imageName: string): void {
  const history = getAnalysisHistory();

  const newAnalysis: ISavedAnalysis = {
    id: crypto.randomUUID(),
    words,
    imageName,
    createdAt: new Date().toISOString(),
  };

  history.unshift(newAnalysis); // 최신 항목을 맨 앞에 추가
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// 로컬 스토리지에서 전체 히스토리 불러오기
export function getAnalysisHistory(): ISavedAnalysis[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return [];

    return JSON.parse(stored) as ISavedAnalysis[];
  } catch (error) {
    console.error(error);
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
}): ISavedAnalysis[] {
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

// 특정 단어 업데이트
export function updateWordInAnalysis({
  historyId,
  targetWord,
  newMeaning,
  newLevel,
}: {
  historyId: string;
  targetWord: string;
  newMeaning: string;
  newLevel: string;
}): ISavedAnalysis[] {
  const history = getAnalysisHistory();

  const updated = history.map((item) => {
    if (item.id !== historyId) return item;

    const updatedWords = item.words.map((wordInfo) => {
      if (wordInfo.word !== targetWord) return wordInfo;

      return {
        ...wordInfo,
        meaning: newMeaning,
        level: newLevel as IWord["level"],
      };
    });

    return { ...item, words: updatedWords };
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
}

// 단어를 분석 결과에 다시 추가 (삭제 취소용)
export function addWordToAnalysis({
  historyId,
  deletedWord,
}: {
  historyId: string;
  deletedWord: IWord;
}): ISavedAnalysis[] {
  const history = getAnalysisHistory();

  const updated = history.map((item) => {
    if (item.id !== historyId) return item;

    // 이미 같은 단어가 있는지 확인
    const exists = item.words.some((w) => w.word === deletedWord.word);

    if (exists) return item;

    return { ...item, words: [...item.words, deletedWord] };
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
}

// 전체 히스토리 삭제
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
