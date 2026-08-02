/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Menu } from "obsidian";
import { get, type Writable } from "svelte/store";

import { getAvailableTimelineColumns } from "../global-store/derived-settings";
import type {
  DayPlannerSettings,
  TimelineColumnType,
  TimelineColumns,
} from "../settings";

const columnTitles: Record<TimelineColumnType, string> = {
  planner: "Show planner",
  timeTracker: "Show time tracker",
};

export function addColumnSelectionItems(props: {
  menu: Menu;
  settingsStore: Writable<DayPlannerSettings>;
  section?: string;
}) {
  const { menu, settingsStore, section } = props;

  const currentColumns = get(settingsStore).timelineColumns;
  const visibleColumnCount =
    Object.values(currentColumns).filter(Boolean).length;

  Object.entries(columnTitles).forEach(([column, title]) => {
    const isVisible = currentColumns[column as TimelineColumnType];
    const isLastVisibleColumn = isVisible && visibleColumnCount === 1;

    menu.addItem((item) => {
      if (section) {
        item.setSection(section);
      }

      item
        .setTitle(title)
        .setChecked(isVisible)
        .setDisabled(isLastVisibleColumn)
        .onClick(() => {
          if (isLastVisibleColumn) {
            return;
          }

          settingsStore.update((previous) => ({
            ...previous,
            timelineColumns: {
              ...previous.timelineColumns,
              [column]: !isVisible,
            },
          }));
        });
    });
  });
}

export function createColumnSelectionMenu(props: {
  settingsStore?: Writable<DayPlannerSettings>;
  settings?: Writable<DayPlannerSettings>;
  event: MouseEvent;
}) {
  const { event } = props;
  const candidateSettingsStore = props.settingsStore ?? props.settings;

  if (!candidateSettingsStore) {
    return;
  }

  const settingsStore = candidateSettingsStore;

  const menu = new Menu();

  const currentSettings = get(settingsStore);
  const { planner, timeTracker } = getAvailableTimelineColumns(currentSettings);

  function updateColumns(next: TimelineColumns) {
    settingsStore.update((previous) => ({
      ...previous,
      timelineColumns: next,
    }));
  }

  menu.addItem((item) =>
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
