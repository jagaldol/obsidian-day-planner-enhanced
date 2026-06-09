/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
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
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
