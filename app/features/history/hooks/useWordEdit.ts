import { useState } from "react";

import type { IWordWithDate } from "~/features/history/types";
import type { JlptLevel } from "~/types";

interface IEditingWord {
  historyId: string;
  word: string;
}

/**
 * 단어 편집 모드를 관리하는 커스텀 훅
 * - 편집 중인 단어 상태 관리
 * - 편집 값(뜻, 레벨) 관리
 * - 편집 시작/취소/완료 액션
 */
export function useWordEdit() {
  const [editingWord, setEditingWord] = useState<IEditingWord | null>(null);
  const [editedMeaning, setEditedMeaning] = useState("");
  const [editedLevel, setEditedLevel] = useState<JlptLevel>("N5");

  /** 편집 모드 시작 - 선택한 단어의 현재 값으로 초기화 */
  const startEdit = (word: IWordWithDate) => {
    setEditingWord({
      historyId: word.analysisId,
      word: word.word,
    });
    setEditedMeaning(word.meaning);
    setEditedLevel(word.level);
  };

  /** 편집 취소 - 모든 편집 상태 초기화 */
  const cancelEdit = () => {
    setEditingWord(null);
    setEditedMeaning("");
    setEditedLevel("N5");
  };

  /** 편집 완료 후 편집 대상만 초기화 (저장 성공 시 사용) */
  const clearEditingWord = () => {
    setEditingWord(null);
  };

  /** 특정 단어가 현재 편집 중인지 확인 */
  const checkIsEditing = (word: IWordWithDate) => {
    return (
      editingWord?.historyId === word.analysisId &&
      editingWord?.word === word.word
    );
  };

  return {
    editingWord,
    editedMeaning,
    editedLevel,
    setEditedMeaning,
    setEditedLevel,
    startEdit,
    cancelEdit,
    clearEditingWord,
    checkIsEditing,
  };
}
