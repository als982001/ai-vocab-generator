export interface IAnalysisRow {
  id: string;
  user_id: string;
  image_name: string;
  created_at: string;
}

export interface IWordRow {
  id: string;
  user_id: string;
  analysis_id: string;
  word: string;
  reading: string;
  meaning: string;
  level: string;
  box_2d: number[] | null;
  created_at: string;
}
