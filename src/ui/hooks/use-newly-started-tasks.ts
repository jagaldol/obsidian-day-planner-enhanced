/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Array } from "effect";
import { derived, get, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../settings";
import type {
  PlanTimeBlock,
  TimeBlock,
  WithDuration,
} from "../../time-block-types";
import type { Moment } from "../../util/obsidian-moment";
import { getEndTime, getNotificationKey } from "../../util/time-block-utils";

interface UseNewlyStartedTasksProps {
  settings: Readable<DayPlannerSettings>;
  currentTime: Readable<Moment>;
  tasksWithTimeForToday: Readable<Array<WithDuration<TimeBlock>>>;
}

export function useNewlyStartedTasks(props: UseNewlyStartedTasksProps) {
  const { settings, currentTime, tasksWithTimeForToday } = props;
  let previousTasksInProgress: Array<WithDuration<PlanTimeBlock>> = [];

  return derived([settings, currentTime], ([$settings, $currentTime]) => {
    if (!$settings.showTaskNotification) {
      return [];
    }

    const tasksInProgress = get(tasksWithTimeForToday).filter<
      WithDuration<PlanTimeBlock>
    >(
      (task): task is WithDuration<PlanTimeBlock> =>
        task.startTime.isBefore($currentTime) &&
        getEndTime(task).isAfter($currentTime) &&
        (task.source === "dailyNoteDate" || task.source === "tasksPluginProp"),
    );

    const newlyStarted = Array.differenceWith<WithDuration<PlanTimeBlock>>(
      (a, b) => getNotificationKey(a) === getNotificationKey(b),
    )(tasksInProgress, previousTasksInProgress);

    previousTasksInProgress = tasksInProgress;

    return newlyStarted;
  });
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
