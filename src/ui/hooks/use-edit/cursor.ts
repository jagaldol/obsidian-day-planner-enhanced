/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { derived, type Readable } from "svelte/store";

import { EditMode, type EditOperation } from "./types";

export function useCursor(editOperation: Readable<EditOperation | undefined>) {
  return derived(editOperation, ($editOperation) => {
    if (
      $editOperation?.mode === EditMode.CREATE ||
      $editOperation?.mode === EditMode.DRAG ||
      $editOperation?.mode === EditMode.DRAG_AND_SHIFT_OTHERS
    ) {
      return {
        bodyCursor: "grabbing",
        gripCursor: "grabbing",
      };
    }

    if (
      $editOperation?.mode === EditMode.RESIZE ||
      $editOperation?.mode === EditMode.RESIZE_AND_SHIFT_OTHERS
    ) {
      return { bodyCursor: "row-resize", gripCursor: "grab" };
    }

    return {
      bodyCursor: "unset",
      gripCursor: "grab",
    };
  });
}
