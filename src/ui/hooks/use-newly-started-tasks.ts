/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { differenceBy } from "lodash/fp";
import { derived, get, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../settings";
import type { Task, WithTime } from "../../task-types";
import type { Moment } from "../../util/obsidian-moment";
import { getEndTime, getNotificationKey } from "../../util/task-utils";

interface UseNewlyStartedTasksProps {
  settings: Readable<DayPlannerSettings>;
  currentTime: Readable<Moment>;
  tasksWithTimeForToday: Readable<Array<WithTime<Task>>>;
}

export function useNewlyStartedTasks(props: UseNewlyStartedTasksProps) {
  const { settings, currentTime, tasksWithTimeForToday } = props;
  let previousTasksInProgress: Array<WithTime<Task>> = [];

  return derived([settings, currentTime], ([$settings, $currentTime]) => {
    if (!$settings.showTaskNotification) {
      return [];
    }

    const tasksInProgress = get(tasksWithTimeForToday).filter((task) => {
      return (
        task.startTime.isBefore($currentTime) &&
        getEndTime(task).isAfter($currentTime)
      );
    });

    const newlyStarted = differenceBy(
      getNotificationKey,
      tasksInProgress,
      previousTasksInProgress,
    );

    previousTasksInProgress = tasksInProgress;

    return newlyStarted;
  });
}
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
