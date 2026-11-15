// 브라우저 없이 도는 순수 함수 테스트. 화면 fixture(mocks)가 필요 없어 support/test가 아닌 기본 test를 쓴다
import { expect, test } from "@playwright/test";

import { readNdjsonValues, splitNdjsonChunk } from "../app/utils/ndjson";

/**
 * 바이트 청크들을 차례로 내보내는 ReadableStream을 만든다.
 * @param chunks 스트림으로 내보낼 바이트 청크
 * @return body 응답 본문처럼 읽을 수 있는 스트림
 */
function createByteStream({ chunks }: { chunks: Uint8Array[] }): {
  body: ReadableStream<Uint8Array>;
} {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => {
        controller.enqueue(chunk);
      });

      controller.close();
    },
  });

  return { body };
}

/**
 * 스트림의 값을 끝까지 읽어 모은다.
 * @param body 읽을 스트림
 * @return values JSON.parse된 값 목록
 */
async function readAll({
  body,
}: {
  body: ReadableStream<Uint8Array>;
}): Promise<{ values: unknown[] }> {
  const values: unknown[] = [];

  for await (const value of readNdjsonValues({ body })) {
    values.push(value);
  }

  return { values };
}

const encoder = new TextEncoder();

test("NDJSON: 줄이 청크 사이에서 갈려도 이어 붙여 파싱한다", async () => {
  const { body } = createByteStream({
    chunks: [
      encoder.encode('{"type":"te'),
      encoder.encode('xt","text":"a"}\n{"type":'),
      encoder.encode('"done","finishReason":"STOP"}\n'),
    ],
  });

  const { values } = await readAll({ body });

  expect(values).toEqual([
    { type: "text", text: "a" },
    { type: "done", finishReason: "STOP" },
  ]);
});

test("NDJSON: UTF-8 멀티바이트 문자가 바이트 경계에서 갈려도 깨지지 않는다", async () => {
  const bytes = encoder.encode('{"type":"text","text":"사과"}\n');

  // "사"는 3바이트. 첫 바이트 직후에서 자른다
  const cutIndex = bytes.indexOf(0xec) + 1;

  expect(cutIndex).toBeGreaterThan(0);

  const { body } = createByteStream({
    chunks: [bytes.slice(0, cutIndex), bytes.slice(cutIndex)],
  });

  const { values } = await readAll({ body });

  expect(values).toEqual([{ type: "text", text: "사과" }]);
});

test("NDJSON: 끝의 미완성 줄은 버리고, 빈 줄과 CRLF는 허용한다", async () => {
  const { body } = createByteStream({
    chunks: [
      encoder.encode('{"a":1}\r\n\n  \n{"b":2}\n'),
      encoder.encode('{"c":3'),
    ],
  });

  const { values } = await readAll({ body });

  expect(values).toEqual([{ a: 1 }, { b: 2 }]);
});

test("NDJSON: 파싱할 수 없는 줄은 SyntaxError를 던진다", async () => {
  const { body } = createByteStream({
    chunks: [encoder.encode('{"a":1}\nnot json\n')],
  });

  await expect(readAll({ body })).rejects.toThrow(SyntaxError);
});

test("NDJSON: splitNdjsonChunk는 완성된 줄과 남은 조각을 나눈다", () => {
  expect(splitNdjsonChunk({ buffer: '{"a"', chunk: ':1}\r\n{"b":' })).toEqual({
    lines: ['{"a":1}'],
    rest: '{"b":',
  });
  expect(splitNdjsonChunk({ buffer: "", chunk: "\n\n" })).toEqual({
    lines: [],
    rest: "",
  });
});

test("NDJSON: 소비자가 끝까지 읽기 전에 멈추면 스트림을 cancel한다", async () => {
  const cancelReasons: unknown[] = [];

  // 첫 줄만 주고 닫지 않는 스트림 (응답이 계속 오는 중인 상황)
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode('{"a":1}\n{"b":2}\n'));
    },
    cancel(reason) {
      cancelReasons.push(reason);
    },
  });

  for await (const value of readNdjsonValues({ body })) {
    expect(value).toEqual({ a: 1 });
    break;
  }

  expect(cancelReasons).toHaveLength(1);

  // releaseLock까지 끝나 다른 곳에서 다시 잠글 수 있다
  expect(body.locked).toBe(false);
});

test("NDJSON: 끝까지 읽으면 cancel하지 않는다", async () => {
  let isCancelled = false;

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode('{"a":1}\n'));
      controller.close();
    },
    cancel() {
      isCancelled = true;
    },
  });

  const { values } = await readAll({ body });

  expect(values).toEqual([{ a: 1 }]);
  expect(isCancelled).toBe(false);
});
