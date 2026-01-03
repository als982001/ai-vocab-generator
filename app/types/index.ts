export interface Word {
  level: JlptLevel;
  meaning: string;
  reading: string;
  word: string;
}

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface DisplayOptions {
  showFurigana: boolean;
  showRomaji: boolean;
}

export interface UploadedImage {
  file: File;
  preview: string;
}

export interface SavedAnalysis {
  id: string;
  words: Word[];
  imageName: string;
  createdAt: string;
}
