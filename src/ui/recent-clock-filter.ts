type RecentClockSearchTarget = {
  text: string;
  location?: { path: string };
};

export function getRecentClockFilterKeywords(value: string) {
  return value
    .split(/\s+/)
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
}

export function matchesRecentClockFilter(
  task: RecentClockSearchTarget,
  keywords: string[],
) {
  const text = task.text.toLowerCase();
  const path = task.location?.path.toLowerCase() ?? "";

  return keywords.every(
    (keyword) => text.includes(keyword) || path.includes(keyword),
  );
}
