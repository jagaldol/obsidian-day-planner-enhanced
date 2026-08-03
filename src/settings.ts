import type { HexString } from "obsidian";

import { defaultDayFormat } from "./constants";

export interface IcalConfig {
  name: string;
  email?: string;
  url: string;
  color: string;
}

export interface ColorOverride {
  text: string;
  color: string;
  darkModeColor: string;
}

export const eventFormats = ["task", "bullet"] as const;
export const hideTasksMetadataDescription =
  "Hide Tasks dates/completion (⏳ 📅 ➕ 🛫 ✅), recurrence (🔁), priority, IDs/dependencies, on-completion, and inline fields like (scheduled:: …). Descriptions and tags stay visible; source notes are unchanged.";
export const hideTimeRangeInSingleLineDescription =
  "Give task text more room by hiding the time range whenever a block uses a single-line header, including compact blocks.";
export const firstDaysOfWeek = [
  "monday",
  "sunday",
  "saturday",
  "friday",
] as const;
export const firstDayOfWeekOptions = {
  monday: "Monday",
  sunday: "Sunday",
  saturday: "Saturday",
  friday: "Friday",
} as const satisfies Record<(typeof firstDaysOfWeek)[number], string>;
export const timelineZoomLevelMin = 1;
export const timelineZoomLevelMax = 5;
export const timelineZoomLevelStep = 1;
export const timelineZoomLevelOptions = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
} as const;

export type TimelineColumnType = "timeTracker" | "planner";
export type TimelineColumns = Record<TimelineColumnType, boolean>;

export interface DayPlannerSettings {
  progressIndicator: "mini-timeline" | "pie" | "bar" | "none";
  showTaskNotification: boolean;
  zoomLevel: number;
  timelineIcon: string;
  endLabel: string;
  startHour: number;
  timelineDateFormat: string;
  centerNeedle: boolean;
  plannerHeading: string;
  plannerHeadingLevel: number;
  timelineColored: boolean;
  timelineStartColor: HexString;
  timelineEndColor: HexString;
  timestampFormat: string;
  hourFormat: string;
  extendDurationUntilNext: boolean;
  defaultDurationMinutes: number;
  minimalDurationMinutes: number;
  showTimestampInTaskBlock: boolean;
  enableTimeTracker: boolean;
  showActiveClockInStatusBar: boolean;
  showNow: boolean;
  showNext: boolean;
  snapStepMinutes: number;
  pluginVersion: string;
  showCompletedTasks: boolean;
  showSubtasksInTaskBlocks: boolean;
  hideTasksMetadata: boolean;
  hideTimeRangeInSingleLine: boolean;
  icals: Array<IcalConfig>;
  colorOverrides: Array<ColorOverride>;
  releaseNotes: boolean;
  taskStatusOnCreation: string;
  eventFormatOnCreation: (typeof eventFormats)[number];
  sortTasksInPlanAfterEdit: boolean;
  firstDayOfWeek: (typeof firstDaysOfWeek)[number];
  multiDayRange: "full-week" | "work-week" | "3-days";
  timelineColumns: TimelineColumns;
}

export const defaultSettings: DayPlannerSettings = {
  snapStepMinutes: 10,
  progressIndicator: "mini-timeline",
  showTaskNotification: false,
  zoomLevel: 2,
  timelineIcon: "calendar-with-checkmark",
  endLabel: "All done",
  startHour: 6,
  timelineDateFormat: defaultDayFormat,
  centerNeedle: false,
  plannerHeading: "Day planner",
  plannerHeadingLevel: 1,
  timelineColored: false,
  timelineStartColor: "#006466",
  timelineEndColor: "#4d194d",
  timestampFormat: "HH:mm",
  hourFormat: "H",
  extendDurationUntilNext: false,
  defaultDurationMinutes: 30,
  minimalDurationMinutes: 10,
  showTimestampInTaskBlock: false,
  showNow: true,
  showNext: true,
  pluginVersion: "",
  showCompletedTasks: true,
  showSubtasksInTaskBlocks: true,
  hideTasksMetadata: false,
  hideTimeRangeInSingleLine: false,
  icals: [],
  colorOverrides: [],
  releaseNotes: true,
  taskStatusOnCreation: " ",
  eventFormatOnCreation: "task",
  sortTasksInPlanAfterEdit: false,
  firstDayOfWeek: "monday",
  multiDayRange: "3-days",
  enableTimeTracker: true,
  showActiveClockInStatusBar: true,
  timelineColumns: { planner: true, timeTracker: false },
};

type StoredDayPlannerSettings = Partial<DayPlannerSettings> & {
  showUncheduledTasks?: boolean;
  showUnscheduledNestedTasks?: boolean;
  showTimelineInSidebar?: boolean;
};

export function mergeStoredSettings(
  storedSettings: StoredDayPlannerSettings | null,
): DayPlannerSettings {
  const currentSettings = { ...storedSettings };
  delete currentSettings.showUncheduledTasks;
  delete currentSettings.showUnscheduledNestedTasks;
  delete currentSettings.showTimelineInSidebar;

  return {
    ...defaultSettings,
    ...currentSettings,
  };
}

export const defaultSettingsForTests = {
  ...defaultSettings,
  startHour: 0,
  zoomLevel: 1,
};
