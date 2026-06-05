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
