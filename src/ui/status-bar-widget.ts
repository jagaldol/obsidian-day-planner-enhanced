/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { mount, unmount } from "svelte";
import { type Readable } from "svelte/store";

import { currentTime } from "../global-store/current-time";
import type DayPlanner from "../main";
import { keepRangeOnToday, type DateRanges } from "../redux/date-ranges";
import type { RootState } from "../redux/store";
import type { UseSelector } from "../redux/use-selector";
import type { LogEntryEditor } from "../service/log-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { TimeBlock, WithDuration } from "../time-block-types";

import StatusBarWidget from "./components/status-bar-widget.svelte";
import type { OpenLogEntryEditModal } from "./log-entry-edit-modal";

export function mountStatusBarWidget(props: {
  plugin: DayPlanner;
  dateRanges: DateRanges;
  timeBlocksWithTimeForToday: Readable<Array<WithDuration<TimeBlock>>>;
  useSelector: UseSelector<RootState>;
  logEntryEditor: LogEntryEditor;
  workspaceFacade: WorkspaceFacade;
  openLogEntryEditModal: OpenLogEntryEditModal;
  openClockInOnAnythingModal: () => void;
}) {
  const {
    plugin,
    timeBlocksWithTimeForToday,
    dateRanges,
    useSelector,
    logEntryEditor,
    workspaceFacade,
    openLogEntryEditModal,
    openClockInOnAnythingModal,
  } = props;

  const statusBarWidgetContainer = plugin.addStatusBarItem();

  statusBarWidgetContainer.removeClasses(["status-bar-item"]);
  statusBarWidgetContainer.addClass("planner-status-bar-widget-root");

  const dateRange = dateRanges.trackRange([window.moment()]);
  const unsubscribeFromCurrentTime = keepRangeOnToday(dateRange, currentTime);

  const component = mount(StatusBarWidget, {
    target: statusBarWidgetContainer,
    props: {
      onClick: plugin.initTimelineLeaf,
      timeBlocksWithTimeForToday,
      useSelector,
      logEntryEditor,
      workspaceFacade,
      openLogEntryEditModal,
      openClockInOnAnythingModal,
    },
  });

  return async () => {
    unsubscribeFromCurrentTime();
    dateRange.untrack();

    await unmount(component);
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
