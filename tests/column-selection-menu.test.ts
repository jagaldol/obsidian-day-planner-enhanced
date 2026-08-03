import moment from "moment";
import { writable } from "svelte/store";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { menuTitles } = vi.hoisted(() => ({
  menuTitles: [] as string[],
}));

vi.mock("obsidian", () => ({
  Menu: class Menu {},
  moment,
}));

import { defaultSettings } from "../src/settings";
import { addColumnSelectionItems } from "../src/ui/column-selection-menu";

const menu = {
  addItem(
    build: (item: {
      onClick: (callback: () => void) => unknown;
      setChecked: (checked: boolean) => unknown;
      setDisabled: (disabled: boolean) => unknown;
      setSection: (section: string) => unknown;
      setTitle: (title: string) => unknown;
    }) => void,
  ) {
    let title = "";
    const item = {
      onClick: () => item,
      setChecked: () => item,
      setDisabled: () => item,
      setSection: () => item,
      setTitle: (value: string) => {
        title = value;
        return item;
      },
    };

    build(item);
    menuTitles.push(title);

    return menu;
  },
};

describe("timeline column selection menu", () => {
  beforeEach(() => {
    menuTitles.length = 0;
  });

  test("does not add column actions while Time Tracker is disabled", () => {
    addColumnSelectionItems({
      menu: menu as never,
      settingsStore: writable({
        ...defaultSettings,
        enableTimeTracker: false,
      }),
    });

    expect(menuTitles).toEqual([]);
  });

  test("adds both column actions while Time Tracker is enabled", () => {
    addColumnSelectionItems({
      menu: menu as never,
      settingsStore: writable({
        ...defaultSettings,
        enableTimeTracker: true,
      }),
    });

    expect(menuTitles).toEqual(["Show planner", "Show time tracker"]);
  });
});
