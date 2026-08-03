import { describe, expect, test } from "vitest";

import {
  defaultSettings,
  mergeStoredSettings,
  timelineZoomLevelMax,
  timelineZoomLevelMin,
  timelineZoomLevelOptions,
} from "../src/settings";

describe("settings migration", () => {
  test("removes retired all-day and sidebar visibility settings", () => {
    const settings = mergeStoredSettings({
      showUncheduledTasks: false,
      showUnscheduledNestedTasks: true,
      showTimelineInSidebar: false,
      startHour: 9,
    });

    expect(settings).not.toHaveProperty("showUncheduledTasks");
    expect(settings).not.toHaveProperty("showUnscheduledNestedTasks");
    expect(settings).not.toHaveProperty("showTimelineInSidebar");
    expect(settings.startHour).toBe(9);
    expect(settings.timelineColumns).toEqual(defaultSettings.timelineColumns);
  });

  test("keeps Tasks metadata visible by default", () => {
    expect(defaultSettings.hideTasksMetadata).toBe(false);
    expect(mergeStoredSettings(null).hideTasksMetadata).toBe(false);
    expect(
      mergeStoredSettings({ hideTasksMetadata: true }).hideTasksMetadata,
    ).toBe(true);
  });

  test("keeps time ranges visible in single-line blocks by default", () => {
    expect(defaultSettings.hideTimeRangeInSingleLine).toBe(false);
    expect(mergeStoredSettings(null).hideTimeRangeInSingleLine).toBe(false);
    expect(
      mergeStoredSettings({ hideTimeRangeInSingleLine: true })
        .hideTimeRangeInSingleLine,
    ).toBe(true);
  });
});

describe("timeline zoom settings", () => {
  test("supports the same 1-5 range on every settings surface", () => {
    expect(timelineZoomLevelMin).toBe(1);
    expect(timelineZoomLevelMax).toBe(5);
    expect(Object.keys(timelineZoomLevelOptions)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });
});
