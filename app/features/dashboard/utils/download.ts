import type { IWord } from "~/types";

/**
 * 단어 목록을 UTF-8 인코딩된 TXT 파일로 다운로드
 */
export function downloadWordsAsTxt(words: IWord[]): void {
  if (words.length === 0) return;

  const today = new Date().toLocaleDateString("ko-KR");

  const header = `================================\nSnap-Voca 단어장 (${today})\n================================\n\n`;
  const wordList = words
    .map(
      (word, index) =>
        `${index + 1}. ${word.word} (${word.reading}) : ${word.meaning} [${word.level}]`
    )
    .join("\n");
  const content = header + wordList;

  // UTF-8 바이트 배열로 변환
  const encoder = new TextEncoder();
  const rawData = encoder.encode(content);

  // UTF-8 BOM 추가 (윈도우 메모장 호환)
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);

  const blob = new Blob([bom, rawData], { type: "text/plain;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "snap-voca-result.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
