/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { Moment } from "moment";

import type { DayPlannerSettings } from "../settings";
import { getMinutesSinceMidnight } from "../util/moment";

export function getAvailableTimelineColumns(settings: DayPlannerSettings) {
  if (!settings.enableTimeTracker) {
    return { planner: true, timeTracker: false };
  }

  return settings.timelineColumns;
}

export function getHourSize(settings: DayPlannerSettings) {
  return settings.zoomLevel * 60;
}

export function getHiddenHoursSize(settings: DayPlannerSettings) {
  return settings.startHour * getHourSize(settings);
}

export function getVisibleHours(settings: DayPlannerSettings) {
  return [...Array(24).keys()].slice(settings.startHour);
}

function timeToTimelineOffset(minutes: number, settings: DayPlannerSettings) {
  return minutes * settings.zoomLevel - getHiddenHoursSize(settings);
}

export function momentToTimelineOffset(
  time: Moment,
  settings: DayPlannerSettings,
) {
  return timeToTimelineOffset(getMinutesSinceMidnight(time), settings);
}

export function snap(
  coords: number,
  { zoomLevel, snapStepMinutes }: DayPlannerSettings,
) {
  return coords - (coords % (snapStepMinutes * zoomLevel));
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
