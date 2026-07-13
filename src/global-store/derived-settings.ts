import type { DayPlannerSettings } from "../settings";

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

export function timeToTimelineOffset(
  minutes: number,
  settings: DayPlannerSettings,
) {
  return minutes * settings.zoomLevel - getHiddenHoursSize(settings);
}

export function snap(
  coords: number,
  { zoomLevel, snapStepMinutes }: DayPlannerSettings,
) {
  return coords - (coords % (snapStepMinutes * zoomLevel));
}
