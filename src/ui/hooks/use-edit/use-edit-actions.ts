/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { get, type Readable, type Writable } from "svelte/store";

import { vibrationDurationMillis } from "../../../constants";
import type { EditableTimeBlock } from "../../../time-block-types";
import type { OnUpdateFn } from "../../../types";

import type { EditOperation } from "./types";

interface UseEditActionsProps {
  baselineTasks: Writable<EditableTimeBlock[]>;
  editOperation: Writable<EditOperation | undefined>;
  tasksWithPendingUpdate: Readable<EditableTimeBlock[]>;
  onUpdate: OnUpdateFn;
}

export function useEditActions({
  editOperation,
  baselineTasks,
  tasksWithPendingUpdate,
  onUpdate,
}: UseEditActionsProps) {
  function startEdit(operation: EditOperation) {
    navigator.vibrate?.(vibrationDurationMillis);
    editOperation.set(operation);
  }

  function cancelEdit() {
    editOperation.set(undefined);
  }

  async function confirmEdit() {
    const currentOperation = get(editOperation);

    if (currentOperation === undefined) {
      return;
    }

    const oldBase = get(baselineTasks);
    const currentTasks = get(tasksWithPendingUpdate);

    baselineTasks.set(currentTasks);
    editOperation.set(undefined);

    const succeeded = await onUpdate(
      oldBase,
      currentTasks,
      currentOperation.mode,
    );

    if (!succeeded) {
      baselineTasks.set(oldBase);
    }
  }

  return {
    startEdit,
    confirmEdit,
    cancelEdit,
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
