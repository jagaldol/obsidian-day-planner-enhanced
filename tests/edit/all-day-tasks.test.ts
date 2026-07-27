import moment from "moment";
import { get } from "svelte/store";
import { test, expect, describe } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import type { EditableTimeBlock } from "../../src/time-block-types";
import { EditMode } from "../../src/ui/hooks/use-edit/types";
import * as t from "../../src/util/time-block-utils";

import {
  baseTask,
  baseTasks,
  day,
  nextDay,
  tasksWithUnscheduledTask,
} from "./util/fixtures";
import { setUp } from "./util/setup";

describe("all-day tasks", () => {
  const range = {
    start: day,
    end: nextDay,
  };

  function allDayTask(props: {
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
      ...baseTask,
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
    const dailyFirst = allDayTask({
      id: "daily-first",
      line: 10,
      path: "fixtures/daily/2023-01-01.md",
      source: "dailyNoteDate",
      startTime: day.clone().add(1, "hour"),
    });
    const dailySecond = allDayTask({
      id: "daily-second",
      line: 11,
      path: "fixtures/daily/2023-01-01.md",
      source: "dailyNoteDate",
    });
    const taskAFirst = allDayTask({
      id: "task-a-first",
      line: 20,
      path: "fixtures/tasks/가.md",
    });
    const taskASecond = allDayTask({
      id: "task-a-second",
      line: 21,
      path: "fixtures/tasks/가.md",
    });
    const taskBFirst = allDayTask({
      id: "task-b-first",
      line: 30,
      path: "fixtures/tasks/나.md",
    });
    const nextDayDaily = allDayTask({
      id: "next-day-daily",
      line: 10,
      path: "fixtures/daily/2023-01-02.md",
      source: "dailyNoteDate",
      startTime: nextDay,
    });
    const expectedIds = [
      "daily-first",
      "daily-second",
      "task-a-first",
      "task-a-second",
      "task-b-first",
      "next-day-daily",
    ];
    const {
      getDisplayedAllDayTasksForMultiDayRow,
      props: { localTasks },
    } = setUp({
      tasks: [
        taskBFirst,
        nextDayDaily,
        taskASecond,
        dailySecond,
        taskAFirst,
        dailyFirst,
      ],
    });
    const displayedIds = () =>
      get(getDisplayedAllDayTasksForMultiDayRow)(range).map(({ id }) => id);

    expect(displayedIds()).toEqual(expectedIds);

    localTasks.set([
      taskAFirst,
      taskASecond,
      taskBFirst,
      dailyFirst,
      dailySecond,
      nextDayDaily,
    ]);

    expect(displayedIds()).toEqual(expectedIds);
  });

  test("an unscheduled task gets moved to another day", () => {
    const { handlers, moveCursorTo, getDisplayedAllDayTasksForMultiDayRow } =
      setUp({
        tasks: tasksWithUnscheduledTask,
      });

    const task = tasksWithUnscheduledTask[0];

    handlers.handleGripMouseDown(task, EditMode.DRAG);
    moveCursorTo(moment("2023-01-02 01:00"), "date");

    expect(get(getDisplayedAllDayTasksForMultiDayRow)(range)).toMatchObject([
      {
        ...task,
        startTime: moment("2023-01-02 01:00"),
      },
    ]);
  });

  test("a scheduled task changes its type to all-day", () => {
    const { handlers, moveCursorTo, getDisplayedAllDayTasksForMultiDayRow } =
      setUp({
        tasks: baseTasks,
        settings: {
          ...defaultSettingsForTests,
          taskStatusOnCreation: ">",
        },
      });

    const task = baseTasks[0];

    handlers.handleGripMouseDown(task, EditMode.DRAG);
    moveCursorTo(task.startTime, "date");

    expect(get(getDisplayedAllDayTasksForMultiDayRow)(range)).toMatchObject([
      {
        ...task,
        isAllDayEvent: true,
      },
    ]);
  });

  test("a scheduled plain list item becomes a task when changed to all-day", () => {
    const task = { ...baseTasks[0], status: undefined };
    const { handlers, moveCursorTo, getDisplayedAllDayTasksForMultiDayRow } =
      setUp({
        tasks: [task],
        settings: {
          ...defaultSettingsForTests,
          eventFormatOnCreation: "bullet",
          taskStatusOnCreation: ">",
        },
      });

    handlers.handleGripMouseDown(task, EditMode.DRAG);
    moveCursorTo(task.startTime, "date");

    expect(get(getDisplayedAllDayTasksForMultiDayRow)(range)).toMatchObject([
      {
        ...task,
        status: ">",
        isAllDayEvent: true,
      },
    ]);
  });

  test("can copy a scheduled task to all-day", () => {
    const { handlers, moveCursorTo, getDisplayedAllDayTasksForMultiDayRow } =
      setUp({ tasks: baseTasks });

    const task = baseTasks[0];

    if (task.source === "unwritten") {
      throw new Error("The fixture task must be a written one");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { path, position, ...taskWithoutFileLocation } = task;

    handlers.handleGripMouseDown(t.copy(task), EditMode.DRAG);
    moveCursorTo(task.startTime, "date");

    expect(get(getDisplayedAllDayTasksForMultiDayRow)(range)).toMatchObject([
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
