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
