import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "~/constants/queryKeys";
import { useAuth } from "~/contexts/AuthContext";
import { saveAnalysis } from "~/services/analysis";
import type { IWord } from "~/types";

interface ISaveAnalysisParams {
  words: IWord[];
  imageName: string;
}

export function useSaveAnalysis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ words, imageName }: ISaveAnalysisParams) =>
      saveAnalysis(user!.id, words, imageName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analysisHistory });
    },
  });
}
