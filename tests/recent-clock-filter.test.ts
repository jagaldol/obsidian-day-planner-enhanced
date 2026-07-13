import { describe, expect, test } from "vitest";

import {
  getRecentClockFilterKeywords,
  matchesRecentClockFilter,
} from "../src/ui/recent-clock-filter";

const task = {
  text: "Prepare Quarterly Report",
  location: { path: "Work/Planning.md" },
};

describe("recent clock filtering", () => {
  test("normalizes whitespace and casing into search keywords", () => {
    expect(getRecentClockFilterKeywords("  QUARTERLY   work  ")).toEqual([
      "quarterly",
      "work",
    ]);
  });

  test("matches all keywords across task text and file path", () => {
    expect(matchesRecentClockFilter(task, ["quarterly", "work"])).toBe(true);
    expect(matchesRecentClockFilter(task, ["report", "planning"])).toBe(true);
    expect(matchesRecentClockFilter(task, ["quarterly", "personal"])).toBe(
      false,
    );
  });

  test("matches an empty filter", () => {
    expect(matchesRecentClockFilter(task, [])).toBe(true);
  });
});
