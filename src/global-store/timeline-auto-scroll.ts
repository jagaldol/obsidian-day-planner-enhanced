import { derived, writable } from "svelte/store";

interface AutoScrollState {
  autoScrollBlocked: boolean;
  centerNeedle: boolean;
  selectionActive: boolean;
}

const selectedTokens = writable<ReadonlySet<symbol>>(new Set());

export const timelineSelectionActive = derived(
  selectedTokens,
  ($selectedTokens) => $selectedTokens.size > 0,
);

export function setTimelineSelectionActive(token: symbol, active: boolean) {
  selectedTokens.update((current) => {
    const next = new Set(current);

    if (active) {
      next.add(token);
    } else {
      next.delete(token);
    }

    return next;
  });
}

export function canAutoScrollToNow({
  autoScrollBlocked,
  centerNeedle,
  selectionActive,
}: AutoScrollState) {
  return centerNeedle && !autoScrollBlocked && !selectionActive;
}
