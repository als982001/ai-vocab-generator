// 의존성 없는 순수 모듈. Playwright 순수 테스트가 직접 import하므로 `~` 런타임 import를 쓰지 않는다

/**
 * 이전에 남은 조각과 새 텍스트를 이어 완성된 줄과 남은 조각으로 나눔
 * (CRLF 허용, 빈 줄 제외, `\n`으로 끝나지 않은 마지막 조각은 rest로 남긴다)
 * @param buffer 이전 호출에서 남은 미완성 줄
 * @param chunk 새로 디코딩한 텍스트
 * @return lines 완성된 줄 목록, rest 다음 호출로 넘길 미완성 줄
 */
export function splitNdjsonChunk({
  buffer,
  chunk,
}: {
  buffer: string;
  chunk: string;
}): { lines: string[]; rest: string } {
  const parts = (buffer + chunk).split("\n");
  const rest = parts.pop() ?? "";

  const lines = parts
    .map((line) => {
      return line.endsWith("\r") ? line.slice(0, -1) : line;
    })
    .filter((line) => {
      return line.trim().length > 0;
    });

  return { lines, rest };
}

/**
 * NDJSON 응답 본문을 읽어 줄마다 JSON.parse한 값을 차례로 내보냄
 * - 멀티바이트 문자가 청크 경계에서 갈려도 TextDecoder stream 모드로 이어 붙인다
 * - 줄 파싱 실패는 SyntaxError 그대로 던진다 (호출자가 분류)
 * - 스트림이 `\n` 없이 끝나면 마지막 미완성 조각은 버린다 (잘린 줄일 수 있음)
 * - 읽기 오류는 그대로 전파한다
 * - 끝까지 읽기 전에 멈추면(소비자가 break·return했거나 파싱 실패) 스트림을 cancel해 연결을 놓는다
 * @param body fetch 응답 본문 스트림
 * @return 줄마다 JSON.parse한 값을 내보내는 async generator
 */
export async function* readNdjsonValues({
  body,
}: {
  body: ReadableStream<Uint8Array>;
}): AsyncGenerator<unknown, void, undefined> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let isStreamDone = false;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        isStreamDone = true;
        break;
      }

      const { lines, rest } = splitNdjsonChunk({
        buffer,
        chunk: decoder.decode(value, { stream: true }),
      });

      buffer = rest;

      for (const line of lines) {
        yield JSON.parse(line) as unknown;
      }
    }
  } finally {
    if (!isStreamDone) {
      // 이미 오류 난 스트림이면 cancel도 reject될 수 있다. 정리 목적이라 결과는 무시한다
      await reader.cancel().catch(() => {});
    }

    reader.releaseLock();
  }
}
