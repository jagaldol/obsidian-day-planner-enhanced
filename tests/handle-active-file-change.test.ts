import fs from "node:fs";

import type { TFile } from "obsidian";
import { get, writable } from "svelte/store";
import { describe, expect, test, vi } from "vitest";

import type { PeriodicNotes } from "../src/service/periodic-notes";
import { handleActiveFileChange } from "../src/util/handle-active-leaf-change";

describe("handleActiveFileChange", () => {
  test("uses the active daily note when the timeline first opens", () => {
    const initialDay = window.moment("2026-07-17");
    const activeDay = window.moment("2026-07-18");
    const dateRange = writable([initialDay]);
    const file = {} as TFile;
    const getDateFromFile = vi.fn(() => activeDay);

    handleActiveFileChange(file, dateRange, {
      getDateFromFile,
    } as unknown as PeriodicNotes);

    expect(getDateFromFile).toHaveBeenCalledWith(file, "day");
    expect(get(dateRange)).toEqual([activeDay]);
  });

  test("keeps the current range for a non-daily file", () => {
    const initialDay = window.moment("2026-07-18");
    const dateRange = writable([initialDay]);

    handleActiveFileChange({} as TFile, dateRange, {
      getDateFromFile: vi.fn(() => undefined),
    } as unknown as PeriodicNotes);

    expect(get(dateRange)).toEqual([initialDay]);
  });

  test("does nothing when Obsidian has no active file", () => {
    const initialDay = window.moment("2026-07-18");
    const dateRange = writable([initialDay]);
    const getDateFromFile = vi.fn();

    handleActiveFileChange(null, dateRange, {
      getDateFromFile,
    } as unknown as PeriodicNotes);

    expect(getDateFromFile).not.toHaveBeenCalled();
    expect(get(dateRange)).toEqual([initialDay]);
  });

  test("is wired to the active file when the timeline opens", () => {
    const timelineView = fs.readFileSync("src/ui/timeline-view.ts", "utf8");

    expect(timelineView).toContain("handleActiveFileChange(");
    expect(timelineView).toContain("this.app.workspace.getActiveFile()");
  });
});
