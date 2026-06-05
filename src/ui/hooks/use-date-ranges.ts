/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { omit } from "lodash/fp";
import {
  type Subscriber,
  type Updater,
  type Writable,
  writable,
} from "svelte/store";

import { getId } from "../../util/id";
import type { Moment } from "../../util/obsidian-moment";

export function useDateRanges() {
  const ranges: Writable<Record<string, Moment[]>> = writable({});

  function trackRange(range: Moment[]) {
    const rangeKey = getId();

    ranges.update((previous) => ({ ...previous, [rangeKey]: range }));

    function untrack() {
      ranges.update(omit([rangeKey]));
    }

    function update(fn: Updater<Moment[]>) {
      ranges.update((previous) => ({
        ...previous,
        [rangeKey]: fn(previous[rangeKey]),
      }));
    }

    function set(value: Moment[]) {
      ranges.update((previous) => ({
        ...previous,
        [rangeKey]: value,
      }));
    }

    function subscribe(fn: Subscriber<Moment[]>) {
      return ranges.subscribe((next) => fn(next[rangeKey]));
    }

    return {
      subscribe,
      update,
      set,
      untrack,
    };
  }

  return {
    trackRange,
    ranges,
  };
}

export type DateRanges = ReturnType<typeof useDateRanges>;
