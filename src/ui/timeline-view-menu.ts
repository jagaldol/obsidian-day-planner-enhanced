/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { Moment } from "moment";
import type { Menu } from "obsidian";

import type { ObsidianContext } from "../types";

import { addColumnSelectionItems } from "./column-selection-menu";

export interface TimelineViewMenuProps {
  reSync: ObsidianContext["reSync"];
  initWeeklyView: ObsidianContext["initWeeklyView"];
  openTimelineSettingsModal: ObsidianContext["openTimelineSettingsModal"];
  openFileForDay: ObsidianContext["workspaceFacade"]["openFileForDay"];
  settingsStore: ObsidianContext["settingsStore"];
  getSelectedDay: () => Moment | undefined;
}

export function addTimelineViewMenuItems(
  menu: Menu,
  props: TimelineViewMenuProps,
) {
  const {
    reSync,
    initWeeklyView,
    openTimelineSettingsModal,
    openFileForDay,
    settingsStore,
    getSelectedDay,
  } = props;

  menu.addItem((item) =>
    item
      .setSection("open")
      .setTitle("Open daily note for selected day")
      .setIcon("pencil")
      .onClick(async () => {
        const selectedDay = getSelectedDay();

        if (!selectedDay) {
          return;
        }

        await openFileForDay(selectedDay);
      }),
  );

  menu.addItem((item) =>
    item
      .setSection("open")
      .setTitle("Open multi-day planner")
      .setIcon("table-2")
      .onClick(initWeeklyView),
  );

  menu.addItem((item) =>
    item
      .setSection("action")
      .setTitle("Re-sync internet calendars")
      .setIcon("sync")
      .onClick(reSync),
  );

  // Note: a section of their own makes Obsidian separate them with lines
  addColumnSelectionItems({ menu, settingsStore, section: "columns" });

  menu.addItem((item) =>
    item
      .setSection("view")
      .setTitle("View settings")
      .setIcon("settings")
      .onClick(openTimelineSettingsModal),
  );
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
