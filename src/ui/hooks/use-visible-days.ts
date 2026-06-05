/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { isEqual, uniqBy } from "lodash/fp";
import { derived, type Readable } from "svelte/store";

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
    const areDaysSame = previousDayKeys && isEqual(dayKeys, previousDayKeys);

    if (!areDaysSame) {
      previousDayKeys = dayKeys;
      set(uniqDays);
    }
  });
}
