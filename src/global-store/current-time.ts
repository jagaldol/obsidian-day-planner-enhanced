/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { derived, fromStore, readable } from "svelte/store";

import type { Moment } from "../util/obsidian-moment";
import { moment } from "../util/obsidian-moment";

const currentTimeRefreshIntervalMillis = 5 * 1000;

export const currentTime = readable<Moment>(moment(), (set) => {
  const interval = window.setInterval(() => {
    set(moment());
  }, currentTimeRefreshIntervalMillis);

  return () => {
    window.clearInterval(interval);
  };
});

export const currentTimeSignal = fromStore(currentTime);

export const isToday = derived(
  currentTime,
  ($currentTime) => (day: Moment) => $currentTime.isSame(day, "day"),
);
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
