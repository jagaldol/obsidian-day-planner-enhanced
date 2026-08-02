import fs from "node:fs";

import type { TFile } from "obsidian";
import { describe, expect, test, vi } from "vitest";

import type { DateRange } from "../src/redux/date-ranges";
import type { PeriodicNotes } from "../src/service/periodic-notes";
import { handleActiveFileChange } from "../src/util/handle-active-leaf-change";

describe("handleActiveFileChange", () => {
  test("uses the active daily note when the timeline first opens", () => {
    const initialDay = window.moment("2026-07-17");
    const activeDay = window.moment("2026-07-18");
    const dateRange = {
      first: initialDay,
      set: vi.fn(),
    } as unknown as DateRange;
    const file = {} as TFile;
    const getDateFromFile = vi.fn(() => activeDay);

    handleActiveFileChange(file, dateRange, {
      getDateFromFile,
    } as unknown as PeriodicNotes);

    expect(getDateFromFile).toHaveBeenCalledWith(file, "day");
    expect(dateRange.set).toHaveBeenCalledWith([activeDay]);
  });

  test("keeps the current range for a non-daily file", () => {
    const initialDay = window.moment("2026-07-18");
    const dateRange = {
      first: initialDay,
      set: vi.fn(),
    } as unknown as DateRange;

    handleActiveFileChange({} as TFile, dateRange, {
      getDateFromFile: vi.fn(() => undefined),
    } as unknown as PeriodicNotes);

    expect(dateRange.set).not.toHaveBeenCalled();
  });

  test("does nothing when Obsidian has no active file", () => {
    const initialDay = window.moment("2026-07-18");
    const dateRange = {
      first: initialDay,
      set: vi.fn(),
    } as unknown as DateRange;
    const getDateFromFile = vi.fn();

    handleActiveFileChange(null, dateRange, {
      getDateFromFile,
    } as unknown as PeriodicNotes);

    expect(getDateFromFile).not.toHaveBeenCalled();
    expect(dateRange.set).not.toHaveBeenCalled();
  });

  test("is wired to active leaf changes when the timeline opens", () => {
    const timelineView = fs.readFileSync("src/ui/timeline-view.ts", "utf8");

    expect(timelineView).toContain("handleActiveLeafChange(");
    expect(timelineView).toContain("this.workspaceFacade.onActiveLeafChange(");
  });
});
