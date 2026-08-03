import moment from "moment";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { menuTitles } = vi.hoisted(() => ({
  menuTitles: [] as string[],
}));

vi.mock("obsidian", () => ({
  Menu: class Menu {
    addItem(
      build: (item: {
        onClick: (callback: () => void) => unknown;
        setIcon: (icon: string) => unknown;
        setTitle: (title: string) => unknown;
        setWarning: (warning: boolean) => unknown;
      }) => void,
    ) {
      let title = "";
      const item = {
        onClick: () => item,
        setIcon: () => item,
        setTitle: (value: string) => {
          title = value;
          return item;
        },
        setWarning: () => item,
      };

      build(item);
      menuTitles.push(title);

      return this;
    }

    addSeparator() {
      return this;
    }

    showAtMouseEvent() {}
  },
  Notice: vi.fn(),
}));

import type { LogEntryEditor } from "../src/service/log-entry-editor";
import type { WorkspaceFacade } from "../src/service/workspace-facade";
import type { PlanTimeBlock } from "../src/time-block-types";
import { createTimeBlockMenu } from "../src/ui/time-block-menu";

const timeBlock: PlanTimeBlock = {
  id: "note.md::7::daily",
  source: "dailyNoteDate",
  path: "note.md",
  position: {
    start: { line: 7, col: 0, offset: 100 },
    end: { line: 7, col: 40, offset: 140 },
  },
  startTime: moment("2026-08-03 09:00"),
  durationMinutes: 60,
  text: "09:00 - 10:00 Task",
  symbol: "-",
  task: " ",
  status: " ",
};

function showMenu(isTimeTrackerEnabled: boolean) {
  createTimeBlockMenu({
    event: new MouseEvent("contextmenu"),
    timeBlock,
    activeLogTimeBlocks: [],
    isTimeTrackerEnabled,
    logEntryEditor: {} as LogEntryEditor,
    workspaceFacade: {} as WorkspaceFacade,
    onEdit: vi.fn(),
    onEditNestedItems: vi.fn(),
    onDelete: vi.fn(),
  });
}

describe("timeline task menu", () => {
  beforeEach(() => {
    menuTitles.length = 0;
  });

  test("shows Clock in while Time Tracker is enabled", () => {
    showMenu(true);

    expect(menuTitles).toContain("Clock in");
  });

  test("hides clock actions while retaining planner actions when disabled", () => {
    showMenu(false);

    expect(menuTitles).not.toContain("Clock in");
    expect(menuTitles).not.toContain("Clock out");
    expect(menuTitles).toEqual([
      "Edit",
      "Reveal task in file",
      "Edit nested items...",
      "Delete",
    ]);
  });
});
