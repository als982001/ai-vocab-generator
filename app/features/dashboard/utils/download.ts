import type { IWord } from "~/types";

/**
 * CSV 필드 이스케이프 처리
 * 쉼표, 줄바꿈, 큰따옴표가 포함된 경우 큰따옴표로 감싸고,
 * 내부 큰따옴표는 두 개로 이스케이프
 */
function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes("\n") || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }

  return field;
}

/**
 * 단어 목록을 UTF-8 BOM이 포함된 CSV 파일로 다운로드
 */
export function downloadWordsAsCsv(words: IWord[]): void {
  if (words.length === 0) return;

  const header = "Word,Reading,Meaning,Level";
  const rows = words.map(
    (word) =>
      `${escapeCsvField(word.word)},${escapeCsvField(word.reading)},${escapeCsvField(word.meaning)},${word.level}`
  );
  const content = [header, ...rows].join("\n");

  // UTF-8 BOM 추가 (Excel 호환)
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "snap-voca-result.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
