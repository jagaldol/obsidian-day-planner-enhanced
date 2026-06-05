/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Menu } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { WorkspaceFacade } from "../service/workspace-facade";
import { type LocalTask } from "../task-types";

export function createTimeBlockMenu(props: {
  event: MouseEvent | TouchEvent;
  task: LocalTask;
  workspaceFacade: WorkspaceFacade;
  onEdit: () => void;
}) {
  const { event, task, workspaceFacade, onEdit } = props;
  const { location } = task;

  // todo: remove when types are fixed
  isNotVoid(location);

  const {
    path,
    position: {
      start: { line },
    },
  } = location;

  const menu = new Menu();

  menu.addItem((item) => {
    item.setTitle("Edit").setIcon("pencil").onClick(onEdit);
  });

  menu.addItem((item) => {
    item
      .setTitle("Reveal task in file")
      .setIcon("file-input")
      .onClick(async () => {
        await workspaceFacade.revealLineInFile(path, line);
      });
  });

  // Obsidian works fine with touch events, but its TypeScript definitions don't reflect that.
  // @ts-expect-error
  menu.showAtMouseEvent(event);
}
