import type { SortOption } from "~/features/history/types";
import type { Language } from "~/types";
import { LANGUAGE_CONFIG } from "~/utils/language";

/**
 * 언어별 등급 체계에 맞는 정렬 옵션 목록을 생성
 * @param language 히스토리에서 선택한 언어
 * @return sortOptions 정렬 옵션 목록 (등급 라벨은 언어별로 다름, 예: N5 → N1, A1 → C2)
 */
export function getSortOptions({ language }: { language: Language }): {
  sortOptions: { value: SortOption; label: string }[];
} {
  const { levels } = LANGUAGE_CONFIG[language];
  const easiestLevel = levels[0];
  const hardestLevel = levels[levels.length - 1];

  return {
    sortOptions: [
      { value: "newest", label: "Newest First" },
      { value: "oldest", label: "Oldest First" },
      { value: "level-easy", label: `Level ${easiestLevel} → ${hardestLevel}` },
      { value: "level-hard", label: `Level ${hardestLevel} → ${easiestLevel}` },
    ],
  };
}
