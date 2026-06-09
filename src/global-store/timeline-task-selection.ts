import { writable } from "svelte/store";

import type { LocalTask } from "../task-types";
import { getFirstLine } from "../util/markdown";
import { removeTimeRange } from "../util/task-utils";

export interface TimelineTaskSelectionTarget {
  durationMinutes: number;
  id: string;
  path: string;
  startTimeMillis: number;
  summary: string;
}

const timelineTaskSelectionTarget = writable<
  TimelineTaskSelectionTarget | undefined
>();

function normalizeSummary(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function getTaskSummary(task: LocalTask) {
  return normalizeSummary(removeTimeRange(getFirstLine(task.text)));
}

export const pendingTimelineTaskSelection = {
  subscribe: timelineTaskSelectionTarget.subscribe,
};

export function requestTimelineTaskSelection(
  target: TimelineTaskSelectionTarget,
) {
  timelineTaskSelectionTarget.set(target);
}

export function clearTimelineTaskSelection() {
  timelineTaskSelectionTarget.set(undefined);
}

export function createTimelineTaskSelectionTarget(
  task: LocalTask,
  path: string,
): TimelineTaskSelectionTarget {
  return {
    durationMinutes: task.durationMinutes,
    id: task.id,
    path,
    startTimeMillis: task.startTime.valueOf(),
    summary: normalizeSummary(getFirstLine(task.text)),
  };
}

export function isTimelineTaskSelectionMatch(
  task: LocalTask,
  target: TimelineTaskSelectionTarget,
) {
  if (task.id === target.id) {
    return true;
  }

  return (
    task.location?.path === target.path &&
    task.startTime.valueOf() === target.startTimeMillis &&
    task.durationMinutes === target.durationMinutes &&
    getTaskSummary(task) === target.summary
  );
}

export function isLocatedTimelineTaskSelectionMatch(
  task: LocalTask,
  target: TimelineTaskSelectionTarget,
) {
  return (
    task.location !== undefined && isTimelineTaskSelectionMatch(task, target)
  );
}
