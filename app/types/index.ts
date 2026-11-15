import type { SUPPORTED_LANGUAGES } from "../../shared/constants/prompt";
import type {
  CEFR_LEVELS,
  JLPT_LEVELS,
} from "../../shared/constants/wordSchema";

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

// 등급 목록은 Gemini 응답 스키마(enum)와 같은 상수에서 파생 → 두 곳이 어긋나지 않는다
export type JlptLevel = (typeof JLPT_LEVELS)[number];

// 영어 등급은 AI가 추정한 값이라 공인 등급이 아님
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export type WordLevel = JlptLevel | CefrLevel;

export interface IWord {
  level: WordLevel | null; // AI가 목록 밖 등급을 주면 null (등급 미정)
  meaning: string;
  reading: string; // 일본어: 후리가나, 영어: IPA
  word: string;
  part_of_speech?: string; // 영어 전용
  box_2d?: number[]; // [ymin, xmin, ymax, xmax] (0~1000 scale)
  page?: number;
}

export interface IDisplayOptions {
  showFurigana: boolean;
  showIpa: boolean;
  showPartOfSpeech: boolean;
}

export interface ILanguageConfig {
  label: string;
  levelTitle: string;
  levelTooltip?: string;
  levels: WordLevel[]; // 쉬운 등급 → 어려운 등급 순
  ttsLocale: string;
  fontClassName: string;
  displayOptions: { key: keyof IDisplayOptions; label: string }[];
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
