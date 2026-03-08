import type { IWord } from "~/types";

export interface IWordWithDate extends IWord {
  id: string;
  date: string;
  analysisId: string;
  createdAt: string;
}

export interface IEditingWord {
  wordId: string;
  historyId: string;
  word: string;
}

export type SortOption = "newest" | "oldest" | "level-easy" | "level-hard";
