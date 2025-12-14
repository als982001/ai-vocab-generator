export interface Word {
  id: string;
  kanji: string;
  furigana: string;
  romaji: string;
  korean: string;
  english: string;
  jlptLevel: JlptLevel;
}

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface DisplayOptions {
  showFurigana: boolean;
  showRomaji: boolean;
}

export interface UploadedImage {
  file: File;
  preview: string;
}
