import moment from "moment";
import { describe, expect, test } from "vitest";

import type { DayPlannerSettings } from "../src/settings";
import { getFullWeek } from "../src/util/range";

describe("full-week range", () => {
  test.each<
    [DayPlannerSettings["firstDayOfWeek"], string, string, string]
  >([
    ["monday", "2026-07-13", "2026-07-13", "2026-07-19"],
    ["sunday", "2026-07-12", "2026-07-12", "2026-07-18"],
    ["saturday", "2026-07-18", "2026-07-18", "2026-07-24"],
    ["friday", "2026-07-17", "2026-07-17", "2026-07-23"],
  ])(
    "keeps the selected $0 at the start of its week",
    (firstDayOfWeek, selectedDay, expectedStart, expectedEnd) => {
      const week = getFullWeek(moment(selectedDay), firstDayOfWeek);

      expect(week[0]?.format("YYYY-MM-DD")).toBe(expectedStart);
      expect(week.at(-1)?.format("YYYY-MM-DD")).toBe(expectedEnd);
    },
  );

  test("keeps Sunday and the following Monday in the same Sunday-first week", () => {
    const sundayWeek = getFullWeek(moment("2026-07-12"), "sunday");
    const mondayWeek = getFullWeek(moment("2026-07-13"), "sunday");

    expect(
      sundayWeek.map((day) => day.format("YYYY-MM-DD")),
    ).toEqual(mondayWeek.map((day) => day.format("YYYY-MM-DD")));
  });
});
