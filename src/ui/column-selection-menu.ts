/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Menu } from "obsidian";
import { get, type Writable } from "svelte/store";

import { getAvailableTimelineColumns } from "../global-store/derived-settings";
import type { DayPlannerSettings, TimelineColumns } from "../settings";

export function createColumnSelectionMenu(props: {
  settings: Writable<DayPlannerSettings>;
  event: MouseEvent;
}) {
  const { settings, event } = props;

  const currentSettings = get(settings);
  const { planner, timeTracker } = getAvailableTimelineColumns(currentSettings);

  function updateColumns(next: TimelineColumns) {
    settings.update((previous) => ({
      ...previous,
      timelineColumns: next,
    }));
  }

  const menu = new Menu().addItem((item) =>
    item
      .setTitle("Show Planner")
      .setChecked(planner && !timeTracker)
      .onClick(() => {
        updateColumns({
          planner: true,
          timeTracker: false,
        });
      }),
  );

  if (currentSettings.enableTimeTracker) {
    menu
      .addItem((item) =>
        item
          .setTitle("Show Time Tracker")
          .setChecked(!planner && timeTracker)
          .onClick(() => {
            updateColumns({
              planner: false,
              timeTracker: true,
            });
          }),
      )
      .addItem((item) =>
        item
          .setTitle("Show Planner & Time Tracker")
          .setChecked(planner && timeTracker)
          .onClick(() => {
            updateColumns({
              planner: true,
              timeTracker: true,
            });
          }),
      );
  }

  menu.showAtMouseEvent(event);
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
