import type { ListItemTokens } from "../time-block-types";

/** Parse explicit checkbox markers so even the blank Todo status is unambiguous. */
export function parseHiddenTaskStatuses(input: string): string[] | undefined {
  if (!input.trim()) {
    return [];
  }

  const statuses: string[] = [];
  let end = 0;

  for (const match of input.matchAll(/\[([^\r\n])\]/gu)) {
    if (!/^[\s,]*$/u.test(input.slice(end, match.index))) {
      return undefined;
    }

    statuses.push(match[1]!);
    end = match.index + match[0].length;
  }

  if (statuses.length === 0 || !/^[\s,]*$/u.test(input.slice(end))) {
    return undefined;
  }

  return [...new Set(statuses)];
}

export function hasHiddenTaskStatus(
  item: Pick<ListItemTokens, "task" | "status">,
  hiddenStatuses: readonly string[],
) {
  const status = item.task ?? item.status;

  return status !== undefined && hiddenStatuses.includes(status);
}

/** Filter only a display copy; the indexed children remain available for edits. */
export function filterVisibleTaskChildren<
  T extends Pick<ListItemTokens, "task" | "status"> & { children?: T[] },
>(
  children: T[] | undefined,
  hiddenStatuses: readonly string[],
): T[] | undefined {
  if (!hiddenStatuses.length) {
    return children;
  }

  return children
    ?.filter((child) => !hasHiddenTaskStatus(child, hiddenStatuses))
    .map((child) => ({
      ...child,
      children: filterVisibleTaskChildren(child.children, hiddenStatuses),
    }));
}
