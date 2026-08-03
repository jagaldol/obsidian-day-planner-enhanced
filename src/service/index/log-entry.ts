/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import {
  getDayKeysInRange,
  getDayKeysInRangeEndExclusive,
  strictParse,
} from "../../util/moment";

export function createLogEntry(props: {
  start: string;
  end?: string;
  parentId: string;
  id: string;
  logIndex: number;
  source: "listItemLog" | "frontmatterLog";
}) {
  const { start, end, parentId, id, logIndex, source } = props;

  const parsedStart = strictParse(start);

  const parsedEnd = end
    ? strictParse(end)
    : // TODO: P3 bug
      //  Solution 1: dispatch dayChanged() and update active clocks then; simple & works
      //  Solution 2: calculate dayKeys for active clocks on the fly in selectActiveLogTimeBlocks selector
      //  Solution 3: use sorted array instead of buckets
      window.moment();

  const dayKeys: string[] = end
    ? getDayKeysInRangeEndExclusive(parsedStart, parsedEnd)
    : getDayKeysInRange(parsedStart, parsedEnd);

  return { start, end, parentId, dayKeys, id, logIndex, source };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
