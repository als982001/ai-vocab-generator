export interface IWord {
  level: JlptLevel;
  meaning: string;
  reading: string;
  word: string;
  box_2d?: number[]; // [ymin, xmin, ymax, xmax] (0~1000 scale)
}

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface IDisplayOptions {
  showFurigana: boolean;
  showRomaji: boolean;
}

export interface IUploadedImage {
  file: File;
  preview: string;
}

export interface ISavedAnalysis {
  id: string;
  words: IWord[];
  imageName: string;
  createdAt: string;
}
