import { z } from "zod";
import type {
  AnalysisStreamEvent,
  IAnalyzeProgress,
  IWord,
  Language,
} from "~/types";
import {
  AnalysisError,
  getKindFromStreamErrorCode,
} from "~/utils/analysisError";
import { createJsonArrayItemScanner } from "~/utils/jsonArrayScanner";
import { readNdjsonValues } from "~/utils/ndjson";
import { normalizeWords } from "~/utils/word";

import {
  ANALYSIS_STREAM_ERROR_CODES,
  SUCCESS_FINISH_REASON,
} from "../../shared/constants/analysisStream";

// 서버가 보낸 NDJSON 한 줄의 형태 검증 (shared 이벤트 타입과 같은 모양)
const analysisStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("done"), finishReason: z.string() }),
  z.object({
    type: z.literal("error"),
    code: z.enum(ANALYSIS_STREAM_ERROR_CODES),
  }),
]);

/**
 * /api/analyze의 NDJSON 응답 본문을 분석 스트림 이벤트로 읽음
 * - 줄이 JSON이 아니거나 이벤트 형태가 아니면 AnalysisError(server)
 * - 읽기 오류(연결 끊김 등)는 그대로 전파한다 (호출자가 분류)
 * @param body fetch 응답 본문 스트림
 * @return 검증된 분석 스트림 이벤트를 내보내는 async generator
 */
export async function* readRemoteAnalysisEvents({
  body,
}: {
  body: ReadableStream<Uint8Array>;
}): AsyncGenerator<AnalysisStreamEvent, void, undefined> {
  try {
    for await (const value of readNdjsonValues({ body })) {
      const parsedEvent = analysisStreamEventSchema.safeParse(value);

      if (!parsedEvent.success) {
        throw new AnalysisError({
          kind: "server",
          message: "분석 스트림 이벤트 형식이 올바르지 않습니다.",
          cause: parsedEvent.error,
        });
      }

      yield parsedEvent.data;
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AnalysisError({
        kind: "server",
        message: "분석 스트림 줄을 해석할 수 없습니다.",
        cause: error,
      });
    }

    throw error;
  }
}

/**
 * 분석 스트림 이벤트를 끝까지 소비해 최종 단어 목록을 만듦 (로컬·서버 경로 공통)
 * - 진행 중: 완성된 배열 원소가 생길 때마다 onProgress로 잠정 단어 목록 전달
 * - error 이벤트: 코드에 맞는 AnalysisError
 * - done이 SUCCESS_FINISH_REASON이 아니거나 done 없이 끝남: AnalysisError(incomplete)
 * - 전체 텍스트 JSON.parse 실패 또는 normalizeWords 거부: AnalysisError(format)
 * @param events 분석 스트림 이벤트
 * @param language 추출 언어
 * @param onProgress 잠정 단어 목록을 받을 콜백 (최종 결과 아님)
 * @return words 검증·정규화를 마친 최종 단어 목록
 */
export async function consumeAnalysisStream({
  events,
  language,
  onProgress,
}: {
  events: AsyncIterable<AnalysisStreamEvent>;
  language: Language;
  onProgress?: (progress: IAnalyzeProgress) => void;
}): Promise<{ words: IWord[] }> {
  const textParts: string[] = [];
  const scanner = createJsonArrayItemScanner();
  const completedItems: unknown[] = [];

  let finishReason: string | null = null;

  for await (const event of events) {
    if (event.type === "error") {
      const { kind } = getKindFromStreamErrorCode({ code: event.code });

      throw new AnalysisError({
        kind,
        message: `분석 스트림 오류: ${event.code}`,
      });
    }

    if (event.type === "done") {
      finishReason = event.finishReason;
      break;
    }

    textParts.push(event.text);

    const { items } = scanner.push({ text: event.text });

    if (items.length === 0 || !onProgress) continue;

    completedItems.push(...items);

    // completedItems는 항상 배열이라 normalizeWords가 거부하지 않는다
    const { words: provisionalWords } = normalizeWords({
      rawWords: completedItems,
      language,
    });

    onProgress({ words: provisionalWords });
  }

  if (finishReason !== SUCCESS_FINISH_REASON) {
    throw new AnalysisError({
      kind: "incomplete",
      message: `분석 응답이 완료되지 않았습니다: ${finishReason ?? "finishReason 없음"}`,
    });
  }

  let rawWords: unknown;

  try {
    rawWords = JSON.parse(textParts.join(""));
  } catch (error) {
    throw new AnalysisError({
      kind: "format",
      message: "AI 응답을 JSON으로 해석할 수 없습니다.",
      cause: error,
    });
  }

  try {
    const { words } = normalizeWords({ rawWords, language });

    return { words };
  } catch (error) {
    throw new AnalysisError({
      kind: "format",
      message: "AI 응답 형식이 올바르지 않습니다.",
      cause: error,
    });
  }
}
