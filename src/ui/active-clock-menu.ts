/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Menu } from "obsidian";

import type { LogEntryEditor } from "../service/log-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import type { LogTimeBlock } from "../time-block-types";
import { runWithNoticeOnError } from "../util/effect";

import type { OpenLogEntryEditModal } from "./log-entry-edit-modal";

export function createActiveClockMenu(props: {
  event: PointerEvent | MouseEvent | TouchEvent;
  timeBlock: LogTimeBlock;
  logEntryEditor: LogEntryEditor;
  workspaceFacade: WorkspaceFacade;
  openLogEntryEditModal: OpenLogEntryEditModal;
}) {
  const {
    event,
    timeBlock,
    logEntryEditor,
    workspaceFacade,
    openLogEntryEditModal,
  } = props;

  const menu = new Menu();

  menu.addItem((item) => {
    return (
      item
        .setTitle("Clock out")
        .setIcon("square")
        // todo: code started drifting: pass onClockOut and so on
        .onClick(async () => {
          await runWithNoticeOnError(logEntryEditor.clockOut(timeBlock));
        })
    );
  });

  menu.addItem((item) =>
    item
      .setTitle("Edit...")
      .setIcon("pencil")
      .onClick(() => openLogEntryEditModal(timeBlock)),
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
      .setTitle("Cancel clock")
      .setIcon("trash-2")
      .setWarning(true)
      .onClick(async () => {
        await runWithNoticeOnError(logEntryEditor.cancelClock(timeBlock));
      });
  });

  // The method is asking for a MouseEvent, but it works just fine on mobile
  menu.showAtMouseEvent(event as MouseEvent);
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
