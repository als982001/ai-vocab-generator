// api/analyze.js(서버)와 app(클라이언트 로컬 경로)이 함께 쓰는 Gemini 스트림 → 분석 이벤트 변환.
// 서버가 Node ESM으로 직접 import하므로 런타임 import 없이 이 파일만으로 완결한다 (type import는 지워져서 괜찮다)
import type { GenerateContentResponse } from "@google/genai";

import type { AnalysisStreamEvent } from "../constants/analysisStream";

/**
 * Gemini generateContentStream 응답을 분석 스트림 이벤트로 바꿈
 * - 텍스트가 있는 청크마다 text 이벤트 (빈 텍스트는 보내지 않음)
 * - 스트림이 끝나면 마지막으로 받은 finishReason으로 done 이벤트
 * - finishReason을 한 번도 받지 못하고 끝나면 error(INCOMPLETE_STREAM) 이벤트
 * 반복 중 예외는 잡지 않고 그대로 전파한다 (경로마다 분류 방식이 다름)
 * @param stream generateContentStream이 돌려준 청크 스트림
 * @return 분석 스트림 이벤트를 내보내는 async generator
 */
export async function* toAnalysisStreamEvents({
  stream,
}: {
  stream: AsyncIterable<GenerateContentResponse>;
}): AsyncGenerator<AnalysisStreamEvent, void, undefined> {
  let finishReason: string | null = null;

  for await (const chunk of stream) {
    // text getter: parts가 비면 undefined, thought part는 제외된다
    const text = chunk.text;

    if (text) {
      yield { type: "text", text };
    }

    const chunkFinishReason = chunk.candidates?.[0]?.finishReason;

    if (chunkFinishReason) {
      finishReason = chunkFinishReason;
    }
  }

  if (finishReason === null) {
    yield { type: "error", code: "INCOMPLETE_STREAM" };
  } else {
    yield { type: "done", finishReason };
  }
}
