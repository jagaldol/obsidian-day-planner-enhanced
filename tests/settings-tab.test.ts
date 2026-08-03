import { get, writable } from "svelte/store";
import { describe, expect, test, vi } from "vitest";

const { settingTabRefreshDomState, settingTabUpdate } = vi.hoisted(() => ({
  settingTabRefreshDomState: vi.fn(),
  settingTabUpdate: vi.fn(),
}));

vi.mock("obsidian", () => ({
  PluginSettingTab: class PluginSettingTab {
    containerEl = document.createElement("div");

    constructor(
      readonly app: unknown,
      readonly plugin: unknown,
    ) {}

    update() {
      settingTabUpdate();
    }

    refreshDomState() {
      settingTabRefreshDomState();
    }
  },
  SettingGroup: class SettingGroup {},
}));

import type DayPlanner from "../src/main";
import {
  defaultSettings,
  type DayPlannerSettings,
  hideTasksMetadataDescription,
} from "../src/settings";
import {
  DayPlannerSettingsTab,
  timestampFormatDescription,
} from "../src/ui/settings-tab";

function createSettingsTab(settings: DayPlannerSettings) {
  const settingsStore = writable(settings);
  const setTimeTrackerEnabled = vi.fn(async (enabled: boolean) => {
    settingsStore.update((previous) => ({
      ...previous,
      enableTimeTracker: enabled,
    }));

    return true;
  });
  const plugin = {
    app: {},
    getSettings: () => get(settingsStore),
    setTimeTrackerEnabled,
  } as unknown as DayPlanner;

  return {
    setTimeTrackerEnabled,
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
    expect(serializedDefinitions).toContain("First day of week");
    expect(serializedDefinitions).toContain("Sunday");
    expect(serializedDefinitions).toContain("Enable time tracker");
    expect(serializedDefinitions).toContain('"heading":"Enhanced features"');
    expect(serializedDefinitions).not.toContain(
      '"heading":"Tasks integration"',
    );
    expect(serializedDefinitions).not.toContain('"heading":"Time tracking"');
    expect(serializedDefinitions).toContain("hideTasksMetadata");
    expect(serializedDefinitions).toContain(hideTasksMetadataDescription);
    expect(serializedDefinitions).toContain("hideTimeRangeInSingleLine");
    expect(hideTasksMetadataDescription).toContain("⏳ 📅 ➕ 🛫 ✅");
    expect(hideTasksMetadataDescription).toContain("(scheduled:: …)");
    expect(serializedDefinitions).toContain("Color 1");
    expect(serializedDefinitions).toContain("timelineEndColor");
  });

  test("reads and writes controls through the existing settings store", async () => {
    const { settingsStore, tab } = createSettingsTab({
      ...defaultSettings,
    });

    await tab.setControlValue("releaseNotes", false);

    expect(tab.getControlValue("releaseNotes")).toBe(false);
    expect(get(settingsStore).releaseNotes).toBe(false);

    await tab.setControlValue("eventFormatOnCreation", "bullet");

    expect(get(settingsStore).eventFormatOnCreation).toBe("bullet");

    await tab.setControlValue("hideTasksMetadata", true);

    expect(tab.getControlValue("hideTasksMetadata")).toBe(true);
    expect(get(settingsStore).hideTasksMetadata).toBe(true);

    await tab.setControlValue("hideTimeRangeInSingleLine", true);

    expect(tab.getControlValue("hideTimeRangeInSingleLine")).toBe(true);
    expect(get(settingsStore).hideTimeRangeInSingleLine).toBe(true);

    await tab.setControlValue("firstDayOfWeek", "sunday");

    expect(tab.getControlValue("firstDayOfWeek")).toBe("sunday");
    expect(get(settingsStore).firstDayOfWeek).toBe("sunday");
  });

  test("routes Time Tracker availability through the guarded plugin action", async () => {
    const { setTimeTrackerEnabled, settingsStore, tab } = createSettingsTab({
      ...defaultSettings,
    });

    await tab.setControlValue("enableTimeTracker", false);
    await new Promise((resolve) => window.setTimeout(resolve));

    expect(setTimeTrackerEnabled).toHaveBeenCalledWith(false);
    expect(get(settingsStore).enableTimeTracker).toBe(false);
  });

  test("refreshes dependent declarative controls after the guarded action settles", async () => {
    vi.useFakeTimers();
    const { tab } = createSettingsTab({
      ...defaultSettings,
    });
    settingTabRefreshDomState.mockClear();

    await tab.setControlValue("enableTimeTracker", false);

    expect(settingTabRefreshDomState).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(settingTabRefreshDomState).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  test("restores the guarded Time Tracker toggle when disabling is cancelled", async () => {
    const { setTimeTrackerEnabled, tab } = createSettingsTab({
      ...defaultSettings,
    });
    setTimeTrackerEnabled.mockResolvedValueOnce(false);
    const enhancedGroup = tab
      .getSettingDefinitions()
      .find(
        (definition) =>
          "type" in definition &&
          definition.type === "group" &&
          definition.heading === "Enhanced features",
      );

    expect(enhancedGroup && "type" in enhancedGroup).toBe(true);

    if (
      !enhancedGroup ||
      !("type" in enhancedGroup) ||
      enhancedGroup.type !== "group"
    ) {
      return;
    }

    const trackerSetting = enhancedGroup.items?.find(
      (item) => "name" in item && item.name === "Enable time tracker",
    );

    if (
      !trackerSetting ||
      !("render" in trackerSetting) ||
      typeof trackerSetting.render !== "function"
    ) {
      throw new Error("Expected an imperative Time Tracker setting");
    }

    const values: boolean[] = [];
    let onChange: ((value: boolean) => Promise<void>) | undefined;
    const toggle = {
      setValue(value: boolean) {
        values.push(value);

        return toggle;
      },
      onChange(callback: (value: boolean) => Promise<void>) {
        onChange = callback;

        return toggle;
      },
    };
    const setting = {
      addToggle(callback: (candidate: typeof toggle) => void) {
        callback(toggle);

        return setting;
      },
    };

    trackerSetting.render(setting as never, {} as never);

    if (!onChange) {
      throw new Error("Expected a Time Tracker toggle change handler");
    }

    await onChange(false);

    expect(setTimeTrackerEnabled).toHaveBeenCalledWith(false);
    expect(values).toEqual([true, true]);
  });

  test("disables the active-clock status setting while Time Tracker is disabled", () => {
    const { tab } = createSettingsTab({
      ...defaultSettings,
      enableTimeTracker: false,
    });
    const statusGroup = tab
      .getSettingDefinitions()
      .find(
        (definition) =>
          "type" in definition &&
          definition.type === "group" &&
          definition.heading === "Status bar widget",
      );

    expect(statusGroup && "type" in statusGroup && statusGroup.type).toBe(
      "group",
    );

    if (
      !statusGroup ||
      !("type" in statusGroup) ||
      statusGroup.type !== "group"
    ) {
      return;
    }

    const activeClockSetting = statusGroup.items?.find(
      (item) =>
        "name" in item && item.name === "Show active clock and Clock in button",
    );

    expect(
      activeClockSetting &&
        "control" in activeClockSetting &&
        activeClockSetting.control?.type,
    ).toBe("toggle");

    if (
      !activeClockSetting ||
      !("control" in activeClockSetting) ||
      activeClockSetting.control?.type !== "toggle"
    ) {
      return;
    }

    expect(typeof activeClockSetting.control.disabled).toBe("function");

    if (typeof activeClockSetting.control.disabled !== "function") {
      return;
    }

    expect(activeClockSetting.control.disabled()).toBe(true);
  });

  test("documents the supported 24-hour timestamp syntax", () => {
    expect(timestampFormatDescription).toContain("HH:mm");
    expect(timestampFormatDescription).toContain("':'");
    expect(timestampFormatDescription).toContain("'.'");
    expect(timestampFormatDescription).toContain("require an end time");
    expect(timestampFormatDescription).toContain(
      "immediately follows leading tags",
    );
    expect(timestampFormatDescription).toContain("Restart Obsidian");
    expect(timestampFormatDescription).not.toContain("hh:mm");
  });
});
