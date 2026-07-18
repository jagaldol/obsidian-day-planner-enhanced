import { get, writable } from "svelte/store";
import { describe, expect, test, vi } from "vitest";

vi.mock("obsidian", () => ({
  PluginSettingTab: class PluginSettingTab {
    containerEl = document.createElement("div");

    constructor(
      readonly app: unknown,
      readonly plugin: unknown,
    ) {}

    update() {}
  },
  SettingGroup: class SettingGroup {},
}));

import type DayPlanner from "../src/main";
import { defaultSettings, type DayPlannerSettings } from "../src/settings";
import {
  DayPlannerSettingsTab,
  timestampFormatDescription,
} from "../src/ui/settings-tab";

function createSettingsTab(settings: DayPlannerSettings) {
  const settingsStore = writable(settings);
  const plugin = {
    app: {},
    settings: () => get(settingsStore),
  } as unknown as DayPlanner;

  return {
    settingsStore,
    tab: new DayPlannerSettingsTab(plugin, settingsStore),
  };
}

describe("DayPlannerSettingsTab declarative settings", () => {
  test("indexes regular and dynamic settings for Obsidian settings search", () => {
    const { tab } = createSettingsTab({
      ...defaultSettings,
      icals: [
        {
          name: "Work",
          email: "me@example.com",
          url: "https://example.com/calendar.ics",
          color: "#ffffff",
        },
      ],
      colorOverrides: [
        {
          text: "#important",
          color: "#ffa1a1",
          darkModeColor: "#6e3737",
        },
      ],
    });

    const serializedDefinitions = JSON.stringify(tab.getSettingDefinitions());

    expect(serializedDefinitions).toContain("Show release notes after update");
    expect(serializedDefinitions).toContain("eventFormatOnCreation");
    expect(serializedDefinitions).toContain("Remote calendar URL");
    expect(serializedDefinitions).toContain("Date format in timeline header");
    expect(serializedDefinitions).toContain("Enable time tracker");
    expect(serializedDefinitions).toContain("Color 1");
    expect(serializedDefinitions).toContain("timelineEndColor");
  });

  test("reads and writes controls through the existing settings store", () => {
    const { settingsStore, tab } = createSettingsTab({
      ...defaultSettings,
    });

    tab.setControlValue("releaseNotes", false);

    expect(tab.getControlValue("releaseNotes")).toBe(false);
    expect(get(settingsStore).releaseNotes).toBe(false);

    tab.setControlValue("eventFormatOnCreation", "bullet");

    expect(get(settingsStore).eventFormatOnCreation).toBe("bullet");
  });

  test("documents the supported 24-hour timestamp syntax", () => {
    expect(timestampFormatDescription).toContain("HH:mm");
    expect(timestampFormatDescription).toContain("':'");
    expect(timestampFormatDescription).toContain("'.'");
    expect(timestampFormatDescription).toContain("require an end time");
    expect(timestampFormatDescription).toContain("Restart Obsidian");
    expect(timestampFormatDescription).not.toContain("hh:mm");
  });
});
