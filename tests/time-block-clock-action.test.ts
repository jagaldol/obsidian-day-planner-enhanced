import moment from "moment";
import { describe, expect, test } from "vitest";

import type {
  FrontmatterLogTimeBlock,
  ListItemLogTimeBlock,
  PlanTimeBlock,
} from "../src/time-block-types";
import { getTimeBlockClockAction } from "../src/ui/time-block-clock-action";

const position = {
  start: { line: 7, col: 0, offset: 100 },
  end: { line: 7, col: 40, offset: 140 },
};

const timeBlock: PlanTimeBlock = {
  id: "note.md::7::daily",
  source: "dailyNoteDate",
  path: "note.md",
  position,
  startTime: moment("2026-08-03 09:00"),
  durationMinutes: 60,
  text: "09:00 - 10:00 Task",
  symbol: "-",
  task: " ",
  status: " ",
};

function activeClock(
  overrides: Partial<ListItemLogTimeBlock> = {},
): ListItemLogTimeBlock {
  return {
    id: "note.md::7::0",
    source: "listItemLog",
    path: "note.md",
    position,
    startTime: moment("2026-08-03 09:10"),
    durationMinutes: 15,
    text: "09:00 - 10:00 Task",
    symbol: "-",
    task: " ",
    status: " ",
    isRunning: true,
    ...overrides,
  };
}

describe("timeline task clock action", () => {
  test("shows Clock out for an active clock on the same list item", () => {
    const clock = activeClock();

    expect(getTimeBlockClockAction(timeBlock, [clock])).toEqual({
      icon: "square",
      location: clock,
      title: "Clock out",
      type: "out",
    });
  });

  test("shows Clock in when only another list item is clocked in", () => {
    const clock = activeClock({
      position: {
        start: { line: 8, col: 0, offset: 141 },
        end: { line: 8, col: 40, offset: 181 },
      },
    });

    expect(getTimeBlockClockAction(timeBlock, [clock])).toEqual({
      icon: "play",
      location: timeBlock,
      title: "Clock in",
      type: "in",
    });
  });

  test("does not match a file-level active clock", () => {
    const clock: FrontmatterLogTimeBlock = {
      id: "note.md::frontmatter::0",
      source: "frontmatterLog",
      path: "note.md",
      startTime: moment("2026-08-03 09:10"),
      durationMinutes: 15,
      text: "note",
      symbol: "-",
      isRunning: true,
    };

    expect(getTimeBlockClockAction(timeBlock, [clock]).type).toBe("in");
  });
});
