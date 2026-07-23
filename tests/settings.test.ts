import { describe, expect, test } from "vitest";

import { defaultSettings, mergeStoredSettings } from "../src/settings";

describe("settings migration", () => {
  test("removes the legacy unscheduled nested task setting", () => {
    const settings = mergeStoredSettings({
      showUnscheduledNestedTasks: true,
      startHour: 9,
    });

    expect(settings).not.toHaveProperty("showUnscheduledNestedTasks");
    expect(settings.startHour).toBe(9);
    expect(settings.timelineColumns).toEqual(defaultSettings.timelineColumns);
  });
});
