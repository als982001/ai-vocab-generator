import type { Language, WordLevel } from ".";

export interface IAnalysisRow {
  id: string;
  user_id: string;
  image_name: string;
  language: Language;
  created_at: string;
}

export interface IWordRow {
  id: string;
  user_id: string;
  analysis_id: string;
  word: string;
  reading: string;
  meaning: string;
  level: WordLevel | null;
  part_of_speech: string | null;
  box_2d: number[] | null;
  created_at: string;
}
