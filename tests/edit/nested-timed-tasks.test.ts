import moment from "moment";
import { get } from "svelte/store";
import { describe, expect, test } from "vitest";

import type {
  DailyNoteDateTimeBlock,
  FrontmatterLogTimeBlock,
  ListItemLogTimeBlock,
  RemoteTimeBlock,
  WithDuration,
} from "../../src/time-block-types";
import { hideNestedLocalPlanTimeBlocks } from "../../src/util/time-block-utils";

import { baseTask, dayKey } from "./util/fixtures";
import { setUp } from "./util/setup";

function position(line: number, col: number) {
  return {
    start: { line, col, offset: line * 100 + col },
    end: { line, col, offset: line * 100 + col },
  };
}

function task(
  id: string,
  text: string,
  startTime: string,
  durationMinutes: number,
  line: number,
  col: number,
): DailyNoteDateTimeBlock {
  return {
    ...baseTask,
    source: "dailyNoteDate",
    id,
    text,
    startTime: moment(startTime),
    durationMinutes,
    path: "nested.md",
    position: position(line, col),
  };
}

type LocalTimeBlockChild = NonNullable<
  DailyNoteDateTimeBlock["children"]
>[number];

function allDayTask(
  id: string,
  text: string,
  line: number,
  col: number,
): DailyNoteDateTimeBlock {
  return {
    ...task(id, text, "2023-01-01 00:00", 30, line, col),
    isAllDayEvent: true,
  };
}

function childEntry(
  timeBlock: DailyNoteDateTimeBlock,
  children: LocalTimeBlockChild[] = [],
): LocalTimeBlockChild {
  return {
    id: `${timeBlock.id}-entry`,
    text: timeBlock.text,
    symbol: "-",
    path: timeBlock.path,
    position: timeBlock.position,
    children,
    logEntries: [],
    planEntries: [],
  };
}

describe("nested local plan tasks", () => {
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
        path: nestedChild.path,
        position: nestedChild.position,
        children: [],
        logEntries: [],
        planEntries: [],
      },
      {
        id: "nested-child-outside-parent-time-range-entry",
        text: nestedChildOutsideParentTimeRange.text,
        symbol: "-",
        path: nestedChildOutsideParentTimeRange.path,
        position: nestedChildOutsideParentTimeRange.position,
        children: [],
        logEntries: [],
        planEntries: [],
      },
    ];

    const remoteTask = {
      source: "ical",
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
    } satisfies WithDuration<RemoteTimeBlock>;

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

  test("hides untimed descendants from single-day and multi-day all-day views", () => {
    const timedParent = task(
      "timed-parent",
      "09:00 - 11:00 Work",
      "2023-01-01 09:00",
      120,
      1,
      0,
    );
    const nestedUntimedChild = allDayTask(
      "nested-untimed-child",
      "Draft",
      2,
      4,
    );
    const nestedUntimedGrandchild = allDayTask(
      "nested-untimed-grandchild",
      "Review",
      3,
      8,
    );
    timedParent.children = [
      childEntry(nestedUntimedChild, [childEntry(nestedUntimedGrandchild)]),
    ];

    const allDayParent = allDayTask("all-day-parent", "Take supplements", 5, 0);
    const nestedAllDayChild = allDayTask(
      "nested-all-day-child",
      "Vitamin D",
      6,
      4,
    );
    allDayParent.children = [childEntry(nestedAllDayChild)];

    const unrelatedIndentedTask = allDayTask(
      "unrelated-indented",
      "Unrelated indented task",
      10,
      4,
    );

    const remoteAllDayTask = {
      source: "ical",
      id: "remote-all-day",
      summary: "Remote all-day event",
      startTime: moment("2023-01-01 00:00"),
      durationMinutes: 30,
      isAllDayEvent: true,
      calendar: {
        name: "Work",
        url: "https://example.com/calendar.ics",
        color: "#ffffff",
      },
      rsvpStatus: "ACCEPTED",
    } satisfies WithDuration<RemoteTimeBlock>;

    const { dayToDisplayedTasks, getDisplayedAllDayTasksForMultiDayRow } =
      setUp({
        tasks: [
          timedParent,
          nestedUntimedChild,
          nestedUntimedGrandchild,
          allDayParent,
          nestedAllDayChild,
          unrelatedIndentedTask,
        ],
        remoteTasks: [remoteAllDayTask],
      });

    const displayedForDay = get(dayToDisplayedTasks)[dayKey];

    expect(displayedForDay.noTime.map((it) => it.id)).toEqual([
      "remote-all-day",
      "all-day-parent",
      "unrelated-indented",
    ]);

    expect(displayedForDay.noTime).toContainEqual(
      expect.objectContaining({
        id: "all-day-parent",
        children: [
          expect.objectContaining({
            id: "nested-all-day-child-entry",
          }),
        ],
      }),
    );

    expect(
      get(getDisplayedAllDayTasksForMultiDayRow)({
        start: moment("2023-01-01"),
        end: moment("2023-01-01"),
      }).map((it) => it.id),
    ).toEqual(["remote-all-day", "all-day-parent", "unrelated-indented"]);

    expect(displayedForDay.withTime).toContainEqual(
      expect.objectContaining({
        id: "timed-parent",
        children: [
          expect.objectContaining({
            id: "nested-untimed-child-entry",
            children: [
              expect.objectContaining({
                id: "nested-untimed-grandchild-entry",
              }),
            ],
          }),
        ],
      }),
    );
  });

  test("keeps log and frontmatter records independent", () => {
    const parent = task(
      "parent",
      "09:00 - 11:00 Work",
      "2023-01-01 09:00",
      120,
      1,
      0,
    );
    const nestedSourceLine = task(
      "nested-source-line",
      "09:30 - 10:00 Logged work",
      "2023-01-01 09:30",
      30,
      2,
      4,
    );
    parent.children = [childEntry(nestedSourceLine)];

    const listItemLog = {
      ...nestedSourceLine,
      id: "list-item-log",
      source: "listItemLog",
    } satisfies WithDuration<ListItemLogTimeBlock>;
    const frontmatterLog = {
      source: "frontmatterLog",
      id: "frontmatter-log",
      text: "Frontmatter log",
      symbol: "-",
      path: "nested.md",
      startTime: moment("2023-01-01 10:00"),
      durationMinutes: 30,
    } satisfies WithDuration<FrontmatterLogTimeBlock>;

    expect(
      hideNestedLocalPlanTimeBlocks([parent, listItemLog, frontmatterLog]).map(
        (it) => it.id,
      ),
    ).toEqual(["parent", "list-item-log", "frontmatter-log"]);
  });
});
