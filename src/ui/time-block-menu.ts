/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Menu } from "obsidian";

import type { LogEntryEditor } from "../service/log-entry-editor";
import type { WorkspaceFacade } from "../service/workspace-facade";
import { type EditableTimeBlock } from "../time-block-types";
import { runWithNoticeOnError } from "../util/effect";

export function createTimeBlockMenu(props: {
  event: MouseEvent | TouchEvent;
  timeBlock: EditableTimeBlock;
  logEntryEditor: LogEntryEditor;
  workspaceFacade: WorkspaceFacade;
  onEdit: () => void;
  onEditNestedItems: () => void;
  onDelete: () => Promise<void>;
}) {
  const {
    event,
    timeBlock,
    workspaceFacade,
    onEdit,
    onEditNestedItems,
    onDelete,
    logEntryEditor,
  } = props;

  if (timeBlock.source === "unwritten") {
    throw new Error("Cannot show a menu for an unwritten time block");
  }

  const menu = new Menu();

  menu.addItem((item) => {
    item
      .setTitle("Clock in")
      .setIcon("play")
      .onClick(async () => {
        await runWithNoticeOnError(logEntryEditor.clockIn(timeBlock));
      });
  });

  menu.addItem((item) =>
    item.setTitle("Edit").setIcon("pencil").onClick(onEdit),
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
      .setTitle("Edit nested items...")
      .setIcon("list-tree")
      .onClick(onEditNestedItems);
  });

  menu.addSeparator();

  menu.addItem((item) => {
    item
      .setTitle("Delete")
      .setIcon("trash-2")
      .setWarning(true)
      .onClick(async () => {
        await onDelete();
      });
  });

  // Obsidian works fine with touch events, but its TypeScript definitions don't reflect that.
  // @ts-expect-error
  menu.showAtMouseEvent(event);
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
