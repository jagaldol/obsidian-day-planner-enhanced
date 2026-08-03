/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Menu } from "obsidian";

import type { LogEntry } from "../redux/index/index-slice";
import type { LogEntryEditor } from "../service/log-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { LogTimeBlock } from "../time-block-types";
import { runWithNoticeOnError } from "../util/effect";

import type { OpenLogEntryEditModal } from "./log-entry-edit-modal";
import { showMenuAtEvent } from "./menu-event";

export function createCompletedClockMenu(props: {
  event: PointerEvent | MouseEvent | TouchEvent;
  timeBlock: LogTimeBlock;
  logEntry: LogEntry;
  logEntryEditor: LogEntryEditor;
  workspaceFacade: WorkspaceFacade;
  openLogEntryEditModal: OpenLogEntryEditModal;
}) {
  const {
    event,
    timeBlock,
    logEntry,
    logEntryEditor,
    workspaceFacade,
    openLogEntryEditModal,
  } = props;

  const menu = new Menu();

  menu.addItem((item) =>
    item
      .setTitle("Resume")
      .setIcon("play")
      .onClick(async () => {
        await runWithNoticeOnError(logEntryEditor.clockIn(timeBlock));
      }),
  );

  menu.addItem((item) =>
    item
      .setTitle("Edit...")
      .setIcon("pencil")
      .onClick(() => openLogEntryEditModal(timeBlock, logEntry)),
  );

  menu.addItem((item) => {
    item
      .setTitle("Reveal task in file")
      .setIcon("file-input")
      .onClick(async () => {
        await workspaceFacade.revealLocation(timeBlock);
      });
  });

  menu.addSeparator();

  menu.addItem((item) => {
    item
      .setTitle("Delete")
      .setIcon("trash-2")
      .setWarning(true)
      .onClick(async () => {
        await runWithNoticeOnError(
          logEntryEditor.deleteClock(timeBlock, {
            logIndex: logEntry.logIndex,
            originalStart: logEntry.start,
          }),
        );
      });
  });

  showMenuAtEvent(menu, event);
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
