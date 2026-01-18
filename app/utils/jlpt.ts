import type { JlptLevel } from "~/types";

export const JLPT_LEVELS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

/**
 * JLPT 레벨을 숫자로 변환 (N5=5, N4=4, ..., N1=1)
 */
export function levelToNumber(level: JlptLevel): number {
  return parseInt(level.substring(1));
}
