import type { SortOption } from "~/features/history/types";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "level-easy", label: "Level N5 → N1" },
  { value: "level-hard", label: "Level N1 → N5" },
];
