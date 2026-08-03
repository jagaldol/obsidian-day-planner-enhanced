/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Array } from "effect";
import type { Moment } from "moment";
import { derived, get, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../settings";
import type {
  PlanTimeBlock,
  TimeBlock,
  WithDuration,
} from "../../time-block-types";
import { getEndTime, getNotificationKey } from "../../util/time-block-utils";

interface UseNewlyStartedTimeBlocksProps {
  settingsStore: Readable<DayPlannerSettings>;
  currentTime: Readable<Moment>;
  timeBlocksWithTimeForToday: Readable<Array<WithDuration<TimeBlock>>>;
}

export function useNewlyStartedTimeBlocks(
  props: UseNewlyStartedTimeBlocksProps,
) {
  const { settingsStore, currentTime, timeBlocksWithTimeForToday } = props;
  let previousTimeBlocksInProgress: Array<WithDuration<PlanTimeBlock>> = [];

  return derived(
    [settingsStore, currentTime],
    ([$settingsStore, $currentTime]) => {
      if (!$settingsStore.showTaskNotification) {
        return [];
      }

      const timeBlocksInProgress = get(timeBlocksWithTimeForToday).filter<
        WithDuration<PlanTimeBlock>
      >(
        (timeBlock): timeBlock is PlanTimeBlock =>
          timeBlock.startTime.isBefore($currentTime) &&
          getEndTime(timeBlock).isAfter($currentTime) &&
          timeBlock.source !== "unwritten",
      );

      const newlyStarted = Array.differenceWith<WithDuration<PlanTimeBlock>>(
        (a, b) => getNotificationKey(a) === getNotificationKey(b),
      )(timeBlocksInProgress, previousTimeBlocksInProgress);

      previousTimeBlocksInProgress = timeBlocksInProgress;

      return newlyStarted;
    },
  );
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
