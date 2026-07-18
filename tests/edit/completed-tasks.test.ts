import { get } from "svelte/store";
import { describe, expect, test } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import { isCompleted } from "../../src/util/time-block-utils";

import { baseTask, day } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("completed task visibility", () => {
  test.each([
    [undefined, false],
    [" ", false],
    ["-", false],
    ["x", true],
    ["X", true],
  ])("recognizes completion marker %s", (marker, expected) => {
    expect(isCompleted(marker)).toBe(expected);
  });

  test("hides only completed checkbox tasks", () => {
    const tasks = [
      { ...baseTask, id: "plain", status: undefined },
      {
        ...baseTask,
        id: "unchecked",
        task: " ",
        startTime: baseTask.startTime.clone().add(1, "hour"),
      },
      {
        ...baseTask,
        id: "custom",
        task: "-",
        startTime: baseTask.startTime.clone().add(2, "hours"),
      },
      {
        ...baseTask,
        id: "completed-lower",
        task: "x",
        startTime: baseTask.startTime.clone().add(3, "hours"),
      },
      {
        ...baseTask,
        id: "completed-status-only",
        status: "X",
        task: undefined,
        startTime: baseTask.startTime.clone().add(4, "hours"),
      },
    ];
    const { getDisplayedTasksForTimeline } = setUp({
      tasks,
      settings: {
        ...defaultSettingsForTests,
        showCompletedTasks: false,
      },
    });

    const displayed = get(getDisplayedTasksForTimeline(day));

    expect(displayed.withTime.map(({ id }) => id).sort()).toEqual([
      "custom",
      "plain",
      "unchecked",
    ]);
  });
});
