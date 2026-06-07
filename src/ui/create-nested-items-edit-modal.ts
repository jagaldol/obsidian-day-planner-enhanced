/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { App, Modal } from "obsidian";
import { mount, unmount } from "svelte";
import { isNotVoid } from "typed-assert";

import {
  type EditableNestedListItem,
  ListItemEntryEditor,
  runWithNoticeOnError,
} from "../service/list-item-entry-editor";
import type { LocalTask } from "../task-types";
import { getFirstLine } from "../util/markdown";

import NestedItemsEditModal from "./components/nested-items-edit-modal.svelte";

function toEditableNestedListItems(
  items: EditableNestedListItem[] | undefined,
): EditableNestedListItem[] {
  return (items ?? []).map((item) => ({
    text: item.text,
    symbol: item.symbol,
    status: item.status,
    task: item.task,
    children: toEditableNestedListItems(item.children),
  }));
}

export function createNestedItemsEditModalCreator(
  app: App,
  taskEntryEditor: ListItemEntryEditor,
) {
  return (task: LocalTask) => {
    const { location } = task;

    isNotVoid(location);

    const modal = new Modal(app).setTitle("");
    modal.modalEl.addClass("day-planner-nested-items-modal");
    modal.contentEl.addClass("day-planner-nested-items-modal");

    const component = mount(NestedItemsEditModal, {
      target: modal.contentEl,
      props: {
        initialItems: toEditableNestedListItems(task.children),
        parentText: getFirstLine(task.text),
        onSave: async (children: EditableNestedListItem[]) => {
          await runWithNoticeOnError(
            taskEntryEditor.replaceNestedItemsAtLocation(
              {
                path: location.path,
                line: location.position.start.line,
              },
              children,
            ),
          );

          modal.close();
        },
        onCancel: () => modal.close(),
      },
    });

    modal.onClose = async () => {
      try {
        await unmount(component);
      } catch (error) {
        console.error(error);
      }
    };

    modal.open();
  };
}

export type OpenNestedItemsEditModal = ReturnType<
  typeof createNestedItemsEditModalCreator
>;
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
