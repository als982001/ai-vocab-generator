export interface IWord {
  level: JlptLevel;
  meaning: string;
  reading: string;
  word: string;
  box_2d?: number[]; // [ymin, xmin, ymax, xmax] (0~1000 scale)
  page?: number;
}

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface IDisplayOptions {
  showFurigana: boolean;
}

export interface IUploadedFile {
  file: File;
  preview: string;
  fileType: "image" | "pdf";
}

export interface ISavedAnalysis {
  id: string;
  words: IWord[];
  imageName: string;
  createdAt: string;
}
