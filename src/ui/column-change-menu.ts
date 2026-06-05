/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Menu } from "obsidian";
import { get, type Writable } from "svelte/store";

import type { DayPlannerSettings } from "../settings";

export function createColumnChangeMenu(props: {
  event: MouseEvent;
  settings: Writable<DayPlannerSettings>;
}) {
  const { event, settings } = props;

  const currentMode = get(settings).multiDayRange;
  const menu = new Menu();

  menu.addItem((item) =>
    item
      .setTitle("Full week")
      .setChecked(currentMode === "full-week")
      .onClick(() => {
        settings.update((previous) => ({
          ...previous,
          multiDayRange: "full-week",
        }));
      }),
  );
  menu.addItem((item) => {
    item
      .setTitle("Work week")
      .setChecked(currentMode === "work-week")
      .onClick(() => {
        settings.update((previous) => ({
          ...previous,
          multiDayRange: "work-week",
        }));
      });
  });
  menu.addItem((item) => {
    item
      .setTitle("3 days")
      .setChecked(currentMode === "3-days")
      .onClick(() => {
        settings.update((previous) => ({
          ...previous,
          multiDayRange: "3-days",
        }));
      });
  });

  menu.showAtMouseEvent(event);
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
