import moment from "moment";
import { get } from "svelte/store";
import { describe, expect, test } from "vitest";

import type { LocalTask, RemoteTask, WithTime } from "../../src/task-types";

import { baseTask, dayKey } from "./util/fixtures";
import { setUp } from "./util/setup";

function position(line: number, col: number) {
  return {
    start: { line, col, offset: line * 100 + col },
    end: { line, col, offset: line * 100 + col },
  };
}

function location(line: number, col: number) {
  return {
    path: "nested.md",
    position: position(line, col),
  };
}

function task(
  id: string,
  text: string,
  startTime: string,
  durationMinutes: number,
  line: number,
  col: number,
): WithTime<LocalTask> {
  return {
    ...baseTask,
    id,
    text,
    startTime: moment(startTime),
    durationMinutes,
    location: location(line, col),
  };
}

describe("nested timed tasks", () => {
  test("hides nested timed local tasks from the timeline without hiding unrelated or remote tasks", () => {
    const nestedChild = task(
      "nested-child",
      "10:20 - 11:00 Morning session",
      "2023-01-01 10:20",
      40,
      2,
      4,
    );
    const unrelatedIndentedTask = task(
      "unrelated-indented",
      "12:00 - 12:30 Unrelated indented task",
      "2023-01-01 12:00",
      30,
      10,
      4,
    );
    const topLevelSibling = task(
      "top-level-sibling",
      "16:10 - 17:00 Cafe",
      "2023-01-01 16:10",
      50,
      20,
      0,
    );
    const nestedChildOutsideParentTimeRange = task(
      "nested-child-outside-parent-time-range",
      "15:10 - 16:00 Late nested session",
      "2023-01-01 15:10",
      50,
      3,
      4,
    );
    const parent = task(
      "parent",
      "10:00 - 15:50 Conference block",
      "2023-01-01 10:00",
      350,
      1,
      0,
    );

    parent.children = [
      {
        id: "nested-child-entry",
        text: nestedChild.text,
        symbol: "-",
        path: nestedChild.location!.path,
        position: nestedChild.location!.position,
        children: [],
        logEntries: [],
        planEntries: [],
      },
      {
        id: "nested-child-outside-parent-time-range-entry",
        text: nestedChildOutsideParentTimeRange.text,
        symbol: "-",
        path: nestedChildOutsideParentTimeRange.location!.path,
        position: nestedChildOutsideParentTimeRange.location!.position,
        children: [],
        logEntries: [],
        planEntries: [],
      },
    ];

    const remoteTask = {
      id: "remote",
      summary: "Remote calendar event",
      startTime: moment("2023-01-01 11:00"),
      durationMinutes: 30,
      isAllDayEvent: false,
      calendar: {
        name: "Work",
        url: "https://example.com/calendar.ics",
        color: "#ffffff",
      },
      rsvpStatus: "ACCEPTED",
    } as RemoteTask;

    const { dayToDisplayedTasks } = setUp({
      tasks: [
        parent,
        nestedChild,
        nestedChildOutsideParentTimeRange,
        unrelatedIndentedTask,
        topLevelSibling,
      ],
      remoteTasks: [remoteTask],
    });

    expect(
      get(dayToDisplayedTasks)[dayKey].withTime.map((it) => it.id),
    ).toEqual(["remote", "parent", "unrelated-indented", "top-level-sibling"]);
  });
});
