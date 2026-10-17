import type { IWord, Language, WordLevel } from "~/types";
import type { IAnalysisRow, IWordRow } from "~/types/supabase";

import { supabase } from "./supabase";

/**
 * 분석 결과 저장 (analyses INSERT → words 다건 INSERT)
 * @param userId 로그인 사용자 id
 * @param words 저장할 단어 목록
 * @param imageName 업로드한 파일 이름
 * @param language 추출 언어
 * @return 생성된 analyses row
 */
export async function saveAnalysis({
  userId,
  words,
  imageName,
  language,
}: {
  userId: string;
  words: IWord[];
  imageName: string;
  language: Language;
}): Promise<IAnalysisRow> {
  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .insert({ user_id: userId, image_name: imageName, language })
    .select()
    .single();

  if (analysisError) throw analysisError;

  const wordRows = words.map((word) => ({
    user_id: userId,
    analysis_id: analysis.id,
    word: word.word,
    reading: word.reading,
    meaning: word.meaning,
    level: word.level,
    part_of_speech: word.part_of_speech ?? null,
    box_2d: word.box_2d ?? null,
  }));

  const { error: wordsError } = await supabase.from("words").insert(wordRows);

  if (wordsError) throw wordsError;

  return analysis;
}

// 전체 히스토리 조회 (analyses + words JOIN, 최신순)
export async function getAnalysisHistory(
  userId: string
): Promise<(IAnalysisRow & { words: IWordRow[] })[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select("*, words(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

// 단어 1건 삭제
export async function deleteWord(wordId: string): Promise<void> {
  const { error } = await supabase.from("words").delete().eq("id", wordId);

  if (error) throw error;
}

// 단어 수정 (meaning, level)
export async function updateWord(
  wordId: string,
  meaning: string,
  level: WordLevel | null
): Promise<void> {
  const { error } = await supabase
    .from("words")
    .update({ meaning, level })
    .eq("id", wordId);

  if (error) throw error;
}

// 삭제된 단어 복원 (words INSERT)
export async function restoreWord(
  userId: string,
  analysisId: string,
  word: IWord
): Promise<void> {
  const { error } = await supabase.from("words").insert({
    user_id: userId,
    analysis_id: analysisId,
    word: word.word,
    reading: word.reading,
    meaning: word.meaning,
    level: word.level,
    part_of_speech: word.part_of_speech ?? null,
    box_2d: word.box_2d ?? null,
  });

  if (error) throw error;
}
