import moment from "moment";
import { get, writable } from "svelte/store";
import { describe, expect, test, vi } from "vitest";

const { askForConfirmation } = vi.hoisted(() => ({
  askForConfirmation: vi.fn(),
}));

vi.mock("obsidian", () => {
  class EmptyClass {}

  return {
    AbstractInputSuggest: EmptyClass,
    App: EmptyClass,
    Component: EmptyClass,
    FileView: EmptyClass,
    ItemView: EmptyClass,
    Keymap: EmptyClass,
    MarkdownPreviewView: EmptyClass,
    MarkdownRenderer: EmptyClass,
    Menu: EmptyClass,
    Modal: EmptyClass,
    Notice: vi.fn(),
    Plugin: EmptyClass,
    PluginSettingTab: EmptyClass,
    SettingGroup: EmptyClass,
    SuggestModal: EmptyClass,
    TFile: EmptyClass,
    Vault: EmptyClass,
    Workspace: EmptyClass,
    WorkspaceLeaf: EmptyClass,
    getAllTags: vi.fn(),
    moment,
    normalizePath: (path: string) => path,
    request: vi.fn(),
    sanitizeHTMLToDom: vi.fn(),
    stripHeadingForLink: (heading: string) => heading,
    stringifyYaml: vi.fn(),
  };
});

vi.mock("obsidian-daily-notes-interface", () => ({
  createDailyNote: vi.fn(),
  getAllDailyNotes: vi.fn(),
  getDailyNote: vi.fn(),
  getDailyNoteSettings: vi.fn(),
}));

vi.mock("../src/ui/confirmation-modal", () => ({
  askForConfirmation,
}));

import DayPlanner from "../src/main";
import { defaultSettings } from "../src/settings";

describe("DayPlanner workspace leaf cleanup", () => {
  test("wraps synchronous leaf detachment in an asynchronous boundary", async () => {
    const detachLeavesOfType = vi.fn();
    const plugin = Object.create(DayPlanner.prototype) as DayPlanner;

    Object.assign(plugin, {
      app: {
        workspace: { detachLeavesOfType },
      },
    });

    const operation = (
      plugin as unknown as {
        detachLeavesOfType: (type: string) => Promise<void>;
      }
    ).detachLeavesOfType("planner-time-tracker");

    expect(detachLeavesOfType).toHaveBeenCalledOnce();
    expect(detachLeavesOfType).toHaveBeenCalledWith("planner-time-tracker");

    let resolved = false;
    void operation.then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    await Promise.resolve();
    expect(resolved).toBe(true);
  });
});

describe("DayPlanner Time Tracker availability", () => {
  test("keeps Time Tracker enabled when disabling an active clock is cancelled", async () => {
    const settingsStore = writable({ ...defaultSettings });
    const plugin = new DayPlanner({} as never, {} as never);
    askForConfirmation.mockResolvedValueOnce(false);

    Object.assign(plugin, {
      app: {},
      getActiveClockCount: () => 1,
      getSettings: () => get(settingsStore),
      settingsStore,
    });

    await expect(plugin.setTimeTrackerEnabled(false)).resolves.toBe(false);
    expect(get(settingsStore).enableTimeTracker).toBe(true);
    expect(askForConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        app: {},
        title: "Disable Time Tracker?",
        variant: "warning",
      }),
    );
  });

  test("disables Time Tracker after accepting the active-clock warning", async () => {
    const settingsStore = writable({ ...defaultSettings });
    const plugin = new DayPlanner({} as never, {} as never);
    askForConfirmation.mockResolvedValueOnce(true);

    Object.assign(plugin, {
      app: {},
      getActiveClockCount: () => 2,
      getSettings: () => get(settingsStore),
      settingsStore,
    });

    await expect(plugin.setTimeTrackerEnabled(false)).resolves.toBe(true);
    expect(get(settingsStore).enableTimeTracker).toBe(false);
  });
});
