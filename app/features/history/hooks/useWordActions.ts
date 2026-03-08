import { toast } from "sonner";
import {
  useDeleteWord,
  useRestoreWord,
  useUpdateWord,
} from "~/features/history/hooks/useWordMutations";
import type { IEditingWord, IWordWithDate } from "~/features/history/types";
import type { JlptLevel } from "~/types";

export function useWordActions(allWords: IWordWithDate[]) {
  const deleteWordMutation = useDeleteWord();
  const updateWordMutation = useUpdateWord();
  const restoreWordMutation = useRestoreWord();

  const handleDeleteWord = (targetWord: IWordWithDate) => {
    if (deleteWordMutation.isPending) return;

    if (confirm("정말 이 단어를 삭제하시겠습니까?")) {
      deleteWordMutation.mutate(targetWord.id, {
        onSuccess: () => {
          toast.success("단어가 삭제되었습니다.", {
            action: {
              label: "취소",
              onClick: () => {
                restoreWordMutation.mutate(
                  {
                    analysisId: targetWord.analysisId,
                    word: {
                      word: targetWord.word,
                      reading: targetWord.reading,
                      meaning: targetWord.meaning,
                      level: targetWord.level,
                      box_2d: targetWord.box_2d,
                    },
                  },
                  {
                    onSuccess: () => toast.success("삭제가 취소되었습니다."),
                  }
                );
              },
            },
          });
        },
      });
    }
  };

  const handleSaveEdit = (
    editingWord: IEditingWord | null,
    editedMeaning: string,
    editedLevel: JlptLevel,
    onSuccess: () => void
  ) => {
    if (!editingWord || updateWordMutation.isPending) return;

    const { wordId } = editingWord;
    const originalWord = allWords.find((w) => w.id === wordId);

    updateWordMutation.mutate(
      { wordId, meaning: editedMeaning, level: editedLevel },
      {
        onSuccess: () => {
          toast.success("단어가 저장되었습니다.", {
            action: originalWord
              ? {
                  label: "취소",
                  onClick: () => {
                    updateWordMutation.mutate(
                      {
                        wordId,
                        meaning: originalWord.meaning,
                        level: originalWord.level,
                      },
                      {
                        onSuccess: () =>
                          toast.success("수정이 취소되었습니다."),
                      }
                    );
                  },
                }
              : undefined,
          });

          onSuccess();
        },
      }
    );
  };

  return { handleDeleteWord, handleSaveEdit };
}
