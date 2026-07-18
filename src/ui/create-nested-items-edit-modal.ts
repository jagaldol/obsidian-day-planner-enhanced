/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { App, Modal, type KeymapEventHandler } from "obsidian";
import { mount, unmount } from "svelte";

import {
  type EditableNestedListItem,
  ListItemEntryEditor,
  runWithNoticeOnError,
} from "../service/list-item-entry-editor";
import type { EditableTimeBlock } from "../time-block-types";
import { getFirstLine } from "../util/markdown";

import NestedItemsEditModal from "./components/nested-items-edit-modal.svelte";

interface NestedItemEditController {
  cancelActiveEdit?: () => void;
}

class NestedItemsHostModal extends Modal {
  private cancelActiveNestedEdit: (() => void) | undefined;
  private escapeCloseSuppressionTimeout: number | undefined;
  private isSuppressingEscapeClose = false;
  private lastPointerActionAt = 0;

  constructor(app: App) {
    super(app);

    this.containerEl.addEventListener(
      "pointerdown",
      () => {
        this.lastPointerActionAt = Date.now();
      },
      true,
    );
  }

  setCancelActiveNestedEdit(cancelActiveNestedEdit: () => void) {
    this.cancelActiveNestedEdit = cancelActiveNestedEdit;
  }

  suppressEscapeCloseForCurrentKey() {
    if (this.escapeCloseSuppressionTimeout !== undefined) {
      window.clearTimeout(this.escapeCloseSuppressionTimeout);
    }

    this.isSuppressingEscapeClose = true;
    this.escapeCloseSuppressionTimeout = window.setTimeout(
      () => this.clearEscapeCloseSuppression(),
      300,
    );
  }

  clearEscapeCloseSuppression() {
    if (this.escapeCloseSuppressionTimeout !== undefined) {
      window.clearTimeout(this.escapeCloseSuppressionTimeout);
    }

    this.escapeCloseSuppressionTimeout = undefined;
    this.isSuppressingEscapeClose = false;
  }

  close() {
    if (this.shouldCancelNestedEditInsteadOfClosing()) {
      this.suppressEscapeCloseForCurrentKey();
      this.cancelActiveNestedEdit?.();
      return;
    }

    super.close();
  }

  private shouldCancelNestedEditInsteadOfClosing() {
    if (this.isSuppressingEscapeClose) {
      return true;
    }

    return this.isNestedEditInputFocused() && !this.hasRecentPointerAction();
  }

  private isNestedEditInputFocused() {
    const activeElement = this.containerEl.ownerDocument.activeElement;

    return (
      activeElement instanceof HTMLInputElement &&
      activeElement.getAttribute("aria-label") === "Nested item text" &&
      this.contentEl.contains(activeElement)
    );
  }

  private hasRecentPointerAction() {
    return Date.now() - this.lastPointerActionAt < 300;
  }
}

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
  return (task: EditableTimeBlock) => {
    if (task.source === "unwritten") {
      throw new Error("Cannot edit nested items on an unwritten time block");
    }

    const { path, position } = task;

    const modal = new NestedItemsHostModal(app).setTitle("");
    modal.modalEl.addClass("day-planner-nested-items-modal");
    modal.contentEl.addClass("day-planner-nested-items-modal");
    const editController: NestedItemEditController = {};
    let isNestedItemEditing = false;

    modal.setCancelActiveNestedEdit(() => {
      editController.cancelActiveEdit?.();
    });

    const escapeEditHandler: KeymapEventHandler = modal.scope.register(
      null,
      "Escape",
      (event) => {
        if (!isNestedItemEditing) {
          return;
        }

        modal.suppressEscapeCloseForCurrentKey();
        editController.cancelActiveEdit?.();
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        return false;
      },
    );

    const component = mount(NestedItemsEditModal, {
      target: modal.contentEl,
      props: {
        editController,
        initialItems: toEditableNestedListItems(task.children),
        parentText: getFirstLine(task.text),
        onEditEscape: () => modal.suppressEscapeCloseForCurrentKey(),
        onEditStateChange: (isEditing: boolean) => {
          isNestedItemEditing = isEditing;
        },
        onSave: async (children: EditableNestedListItem[]) => {
          await runWithNoticeOnError(
            taskEntryEditor.replaceNestedItemsAtLocation(
              {
                path,
                line: position.start.line,
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
        if (escapeEditHandler) {
          modal.scope.unregister(escapeEditHandler);
        }

        modal.clearEscapeCloseSuppression();
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
