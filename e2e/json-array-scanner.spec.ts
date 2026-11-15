// 브라우저 없이 도는 순수 함수 테스트. 화면 fixture(mocks)가 필요 없어 support/test가 아닌 기본 test를 쓴다
import { expect, test } from "@playwright/test";

import { createJsonArrayItemScanner } from "../app/utils/jsonArrayScanner";

/**
 * 텍스트 조각들을 차례로 스캐너에 넣고 방출된 원소를 모은다.
 * @param chunks 스캐너에 넣을 텍스트 조각
 * @return items 방출된 원소 전체
 */
function scanChunks({ chunks }: { chunks: string[] }): { items: unknown[] } {
  const scanner = createJsonArrayItemScanner();

  const items = chunks.flatMap((text) => {
    return scanner.push({ text }).items;
  });

  return { items };
}

/**
 * 기대값: 전체를 JSON.parse한 최상위 배열에서 객체 원소만 남긴다.
 * @param text 완성된 JSON 텍스트
 * @return items 객체 원소 목록 (최상위가 배열이 아니면 빈 배열)
 */
function expectedItems({ text }: { text: string }): { items: unknown[] } {
  const parsed: unknown = JSON.parse(text);

  if (!Array.isArray(parsed)) return { items: [] };

  const items = parsed.filter((item) => {
    return typeof item === "object" && item !== null && !Array.isArray(item);
  });

  return { items };
}

/**
 * 한 글자씩 넣기와 가능한 모든 2분할 위치에서 기대값과 같은지 확인한다.
 * @param text 완성된 JSON 텍스트
 */
function expectAllSplits({ text }: { text: string }) {
  const { items: expected } = expectedItems({ text });

  expect(scanChunks({ chunks: [text] }).items).toEqual(expected);
  expect(scanChunks({ chunks: [...text] }).items).toEqual(expected);

  for (let index = 0; index <= text.length; index += 1) {
    const chunks = [text.slice(0, index), text.slice(index)];

    expect(scanChunks({ chunks }).items, `분할 위치 ${index}`).toEqual(
      expected
    );
  }
}

const TRICKY_WORDS = [
  {
    word: "brace",
    meaning: '괄호 { } [ ] 와 따옴표 " 와 역슬래시 \\ 가 섞인 뜻',
    reading: "/breɪs/",
    level: "B1",
    box_2d: [10, 20, 30, 40],
  },
  {
    word: "café",
    meaning: "카페 é \n 줄바꿈",
    nested: { inner: [1, { deep: "]}" }] },
    box_2d: [1, 2, 3, 4],
  },
];

test("스캐너: 문자열 안 괄호·따옴표·이스케이프와 중첩 객체를 모든 분할 위치에서 같게 처리한다", () => {
  expectAllSplits({ text: JSON.stringify(TRICKY_WORDS) });
});

test("스캐너: 비ASCII를 \\u 이스케이프로 쓴 응답도 이스케이프 중간에서 갈려도 같다", () => {
  const text = '[{"word":"caf\\u00e9","meaning":"\\"인용\\" \\\\ 끝"}]';

  expectAllSplits({ text });
});

test("스캐너: null·숫자·문자열·배열 원소는 건너뛰고 객체만 방출한다", () => {
  const text = JSON.stringify([
    null,
    1,
    "문자열 { 안",
    [{ inArray: true }],
    { word: "apple" },
    true,
    { word: "banana" },
  ]);

  expectAllSplits({ text });
  expect(scanChunks({ chunks: [text] }).items).toEqual([
    { word: "apple" },
    { word: "banana" },
  ]);
});

test("스캐너: 최상위가 객체면 아무것도 방출하지 않는다", () => {
  const text = JSON.stringify({ words: [{ word: "apple" }] });

  expectAllSplits({ text });
  expect(scanChunks({ chunks: [text] }).items).toEqual([]);
});

test("스캐너: 공백·개행이 섞인 들여쓰기 JSON도 처리한다", () => {
  expectAllSplits({ text: JSON.stringify(TRICKY_WORDS, null, 2) });
});

test("스캐너: 최상위 배열이 닫힌 뒤의 입력은 무시한다", () => {
  const { items } = scanChunks({
    chunks: ['[{"word":"apple"}]', ' [{"word":"ignored"}] {"x":1}'],
  });

  expect(items).toEqual([{ word: "apple" }]);
});

test("스캐너: 원소가 완성되는 조각에서만 방출하고, 잘린 원소는 방출하지 않는다", () => {
  const scanner = createJsonArrayItemScanner();

  expect(scanner.push({ text: '[{"word":"ap' }).items).toEqual([]);
  expect(scanner.push({ text: 'ple"},{"word":"ba' }).items).toEqual([
    { word: "apple" },
  ]);
  expect(scanner.push({ text: "nana" }).items).toEqual([]);
});
