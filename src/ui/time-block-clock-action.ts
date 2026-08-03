/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { LogTimeBlock, PlanTimeBlock } from "../time-block-types";

export type TimeBlockClockAction =
  | {
      icon: "play";
      location: PlanTimeBlock;
      title: "Clock in";
      type: "in";
    }
  | {
      icon: "square";
      location: LogTimeBlock;
      title: "Clock out";
      type: "out";
    };

export function getTimeBlockClockAction(
  timeBlock: PlanTimeBlock,
  activeLogTimeBlocks: readonly LogTimeBlock[],
): TimeBlockClockAction {
  const activeClock = activeLogTimeBlocks.find(
    (clock) =>
      clock.source === "listItemLog" &&
      clock.path === timeBlock.path &&
      clock.position.start.line === timeBlock.position.start.line,
  );

  return activeClock
    ? {
        icon: "square",
        location: activeClock,
        title: "Clock out",
        type: "out",
      }
    : {
        icon: "play",
        location: timeBlock,
        title: "Clock in",
        type: "in",
      };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
