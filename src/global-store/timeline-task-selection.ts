/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { writable } from "svelte/store";

import type { EditableTimeBlock } from "../time-block-types";
import { getFirstLine } from "../util/markdown";
import { removeTimeRange } from "../util/time-block-utils";

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

function getTaskSummary(task: EditableTimeBlock) {
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
  task: EditableTimeBlock,
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
  task: EditableTimeBlock,
  target: TimelineTaskSelectionTarget,
) {
  if (task.id === target.id) {
    return true;
  }

  return (
    task.source !== "unwritten" &&
    task.path === target.path &&
    task.startTime.valueOf() === target.startTimeMillis &&
    task.durationMinutes === target.durationMinutes &&
    getTaskSummary(task) === target.summary
  );
}

export function isLocatedTimelineTaskSelectionMatch(
  task: EditableTimeBlock,
  target: TimelineTaskSelectionTarget,
) {
  return (
    task.source !== "unwritten" && isTimelineTaskSelectionMatch(task, target)
  );
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
