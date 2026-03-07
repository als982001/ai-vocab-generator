export function getValidAvatarUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    return ["http:", "https:"].includes(new URL(url).protocol)
      ? url
      : undefined;
  } catch {
    return undefined;
  }
}
