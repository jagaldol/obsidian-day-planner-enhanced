import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import type { EditableTimeBlock } from "../../src/time-block-types";
import { EditMode } from "../../src/ui/hooks/use-edit/types";
import * as t from "../../src/util/time-block-utils";

import {
  baseTimeBlock,
  baseTimeBlocks,
  day,
  nextDay,
  timeBlocksWithUnscheduledTimeBlock,
} from "./util/fixtures";
import { setUp } from "./util/setup";

describe("all-day tasks", () => {
  const range = {
    start: day,
    end: nextDay,
  };

  function allDayTimeBlock(props: {
    id: string;
    line: number;
    path: string;
    source?: "dailyNoteDate" | "tasksPluginProp";
    startTime?: moment.Moment;
  }): EditableTimeBlock {
    const {
      id,
      line,
      path,
      source = "tasksPluginProp",
      startTime = day,
    } = props;

    return {
      ...baseTimeBlock,
      id,
      isAllDayEvent: true,
      path,
      position: {
        start: { line, col: 0, offset: line },
        end: { line, col: 1, offset: line + 1 },
      },
      source,
      startTime,
      text: id,
    };
  }

  test("keeps all-day order stable across file reindexing", () => {
    const dailyFirst = allDayTimeBlock({
      id: "daily-first",
      line: 10,
      path: "fixtures/daily/2023-01-01.md",
      source: "dailyNoteDate",
      startTime: day.clone().add(1, "hour"),
    });
    const dailySecond = allDayTimeBlock({
      id: "daily-second",
      line: 11,
      path: "fixtures/daily/2023-01-01.md",
      source: "dailyNoteDate",
    });
    const timeBlockAFirst = allDayTimeBlock({
      id: "time-block-a-first",
      line: 20,
      path: "fixtures/tasks/가.md",
    });
    const timeBlockASecond = allDayTimeBlock({
      id: "time-block-a-second",
      line: 21,
      path: "fixtures/tasks/가.md",
    });
    const timeBlockBFirst = allDayTimeBlock({
      id: "time-block-b-first",
      line: 30,
      path: "fixtures/tasks/나.md",
    });
    const nextDayDaily = allDayTimeBlock({
      id: "next-day-daily",
      line: 10,
      path: "fixtures/daily/2023-01-02.md",
      source: "dailyNoteDate",
      startTime: nextDay,
    });
    const expectedIds = [
      "daily-first",
      "daily-second",
      "time-block-a-first",
      "time-block-a-second",
      "time-block-b-first",
      "next-day-daily",
    ];
    const {
      getDisplayedAllDayTimeBlocksForMultiDayRow,
      props: { localTimeBlocks },
    } = setUp({
      timeBlocks: [
        timeBlockBFirst,
        nextDayDaily,
        timeBlockASecond,
        dailySecond,
        timeBlockAFirst,
        dailyFirst,
      ],
    });
    const displayedIds = () =>
      get(getDisplayedAllDayTimeBlocksForMultiDayRow)(range).map(
        ({ id }) => id,
      );

    expect(displayedIds()).toEqual(expectedIds);

    localTimeBlocks.set([
      timeBlockAFirst,
      timeBlockASecond,
      timeBlockBFirst,
      dailyFirst,
      dailySecond,
      nextDayDaily,
    ]);

    expect(displayedIds()).toEqual(expectedIds);
  });

  test("an unscheduled task gets moved to another day", () => {
    const {
      handlers,
      moveCursorTo,
      getDisplayedAllDayTimeBlocksForMultiDayRow,
    } = setUp({
      timeBlocks: timeBlocksWithUnscheduledTimeBlock,
    });

    const timeBlock = timeBlocksWithUnscheduledTimeBlock[0];

    handlers.handleGripMouseDown(timeBlock, EditMode.DRAG);
    moveCursorTo(moment("2023-01-02 01:00"), "date");

    expect(
      get(getDisplayedAllDayTimeBlocksForMultiDayRow)(range),
    ).toMatchObject([
      {
        ...timeBlock,
        startTime: moment("2023-01-02 01:00"),
      },
    ]);
  });

  test("a scheduled task changes its type to all-day", () => {
    const {
      handlers,
      moveCursorTo,
      getDisplayedAllDayTimeBlocksForMultiDayRow,
    } = setUp({ timeBlocks: baseTimeBlocks });

    const timeBlock = baseTimeBlocks[0];

    handlers.handleGripMouseDown(timeBlock, EditMode.DRAG);
    moveCursorTo(timeBlock.startTime, "date");

    expect(
      get(getDisplayedAllDayTimeBlocksForMultiDayRow)(range),
    ).toMatchObject([
      {
        ...timeBlock,
        isAllDayEvent: true,
      },
    ]);
  });

  test("a scheduled plain list item becomes a task when changed to all-day", () => {
    const timeBlock = { ...baseTimeBlocks[0], status: undefined };
    const {
      handlers,
      moveCursorTo,
      getDisplayedAllDayTimeBlocksForMultiDayRow,
    } = setUp({
      timeBlocks: [timeBlock],
      settings: {
        ...defaultSettingsForTests,
        eventFormatOnCreation: "bullet",
        taskStatusOnCreation: ">",
      },
    });

    handlers.handleGripMouseDown(timeBlock, EditMode.DRAG);
    moveCursorTo(timeBlock.startTime, "date");

    expect(
      get(getDisplayedAllDayTimeBlocksForMultiDayRow)(range),
    ).toMatchObject([
      {
        ...timeBlock,
        status: ">",
        isAllDayEvent: true,
      },
    ]);
  });

  test("can copy a scheduled task to all-day", () => {
    const {
      handlers,
      moveCursorTo,
      getDisplayedAllDayTimeBlocksForMultiDayRow,
    } = setUp({ timeBlocks: baseTimeBlocks });

    const timeBlock = baseTimeBlocks[0];

    if (timeBlock.source === "unwritten") {
      throw new Error("The fixture task must be a written one");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { path, position, ...taskWithoutFileLocation } = timeBlock;

    handlers.handleGripMouseDown(t.copy(timeBlock), EditMode.DRAG);
    moveCursorTo(timeBlock.startTime, "date");

    expect(
      get(getDisplayedAllDayTimeBlocksForMultiDayRow)(range),
    ).toMatchObject([
      {
        ...taskWithoutFileLocation,
        source: "unwritten",
        destination: { type: "plannerHeading" },
        id: expect.any(String),
        isAllDayEvent: true,
      },
    ]);
  });
});
