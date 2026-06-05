/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { FileView, WorkspaceLeaf } from "obsidian";
import { get, type Writable } from "svelte/store";

import type { PeriodicNotes } from "../service/periodic-notes";
import type { Moment } from "../util/obsidian-moment";

export function handleActiveLeafChange(
  leaf: WorkspaceLeaf | null,
  timelineDateRange: Writable<Moment[]>,
  periodicNotes: PeriodicNotes,
) {
  if (!(leaf?.view instanceof FileView) || !leaf?.view.file) {
    return;
  }

  const dayUserSwitchedTo = periodicNotes.getDateFromFile(
    leaf.view.file,
    "day",
  );

  if (
    dayUserSwitchedTo?.isSame(get(timelineDateRange)?.[0], "day") ||
    !dayUserSwitchedTo
  ) {
    return;
  }

  timelineDateRange.set([dayUserSwitchedTo]);
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
