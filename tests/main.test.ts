import moment from "moment";
import { describe, expect, test, vi } from "vitest";

vi.mock("obsidian", () => {
  class EmptyClass {}

  return {
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
    moment,
    normalizePath: (path: string) => path,
    request: vi.fn(),
    sanitizeHTMLToDom: vi.fn(),
    stringifyYaml: vi.fn(),
  };
});

vi.mock("obsidian-daily-notes-interface", () => ({
  createDailyNote: vi.fn(),
  getAllDailyNotes: vi.fn(),
  getDailyNote: vi.fn(),
  getDailyNoteSettings: vi.fn(),
}));

import DayPlanner from "../src/main";

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
