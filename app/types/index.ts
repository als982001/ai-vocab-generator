import type { SUPPORTED_LANGUAGES } from "../../shared/constants/prompt";
import type {
  CEFR_LEVELS,
  JLPT_LEVELS,
} from "../../shared/constants/wordSchema";

// 분석 스트림 이벤트 타입은 서버와 함께 쓰는 shared 정의를 그대로 노출한다
export type {
  AnalysisHttpErrorCode,
  AnalysisStreamErrorCode,
  AnalysisStreamEvent,
  IAnalysisDoneEvent,
  IAnalysisErrorEvent,
  IAnalysisTextEvent,
} from "../../shared/constants/analysisStream";

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

// 분석 실패 원인 분류 (사용자 안내 문구를 고르는 기준)
// - format: 응답은 끝까지 받았지만 JSON/형식이 잘못됨
// - incomplete: 응답을 끝까지 받지 못함 (중단, STOP 아닌 종료)
// - network: 요청 자체가 나가지 못함
// - client: 파일·요청이 거부됨 (4xx, 429 제외)
// - server: 그 외 서버·상류 오류
export type AnalysisErrorKind =
  | "format"
  | "incomplete"
  | "network"
  | "client"
  | "server";

// 스트리밍 중 지금까지 완성된 단어 (최종 결과 아님)
export interface IAnalyzeProgress {
  words: IWord[];
}

// 스트리밍 JSON 텍스트에서 최상위 배열의 객체 원소를 꺼내는 스캐너 (app/utils/jsonArrayScanner.ts)
export interface IJsonArrayItemScanner {
  push: ({ text }: { text: string }) => { items: unknown[] };
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
