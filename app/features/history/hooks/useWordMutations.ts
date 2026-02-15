import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "~/constants/queryKeys";
import { useAuth } from "~/contexts/AuthContext";
import { deleteWord, restoreWord, updateWord } from "~/services/analysis";
import type { IWord } from "~/types";

export function useDeleteWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wordId: string) => deleteWord(wordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analysisHistory });
    },
  });
}

export function useUpdateWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      wordId,
      meaning,
      level,
    }: {
      wordId: string;
      meaning: string;
      level: string;
    }) => updateWord(wordId, meaning, level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analysisHistory });
    },
  });
}

export function useRestoreWord() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ analysisId, word }: { analysisId: string; word: IWord }) =>
      restoreWord(user!.id, analysisId, word),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analysisHistory });
    },
  });
}
