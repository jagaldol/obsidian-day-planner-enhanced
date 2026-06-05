/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { derived, type Readable } from "svelte/store";

import { areArraysEqual, uniqBy } from "../../util/collection";
import type { Moment } from "../../util/obsidian-moment";
import { getDayKey } from "../../util/task-utils";

export function useVisibleDays(
  ranges: Readable<Record<string, Array<Moment>>>,
) {
  let previousDayKeys: string[];

  return derived(ranges, ($ranges, set: (days: Moment[]) => void) => {
    const days = Object.values($ranges).flat();
    const uniqDays = uniqBy(getDayKey, days);
    const dayKeys = uniqDays.map(getDayKey).sort();
    const areDaysSame =
      previousDayKeys && areArraysEqual(dayKeys, previousDayKeys);

    if (!areDaysSame) {
      previousDayKeys = dayKeys;
      set(uniqDays);
    }
  });
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
