import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "~/constants/queryKeys";
import { useAuth } from "~/contexts/AuthContext";
import { getAnalysisHistory } from "~/services/analysis";

export function useAnalysisHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.analysisHistory,
    queryFn: () => {
      if (!user) throw new Error("User must be authenticated");

      return getAnalysisHistory(user.id);
    },
    enabled: !!user,
  });
}
