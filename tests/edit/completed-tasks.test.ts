import { get } from "svelte/store";
import { describe, expect, test } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import { isCompleted } from "../../src/util/time-block-utils";

import { baseTimeBlock, day } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("completed time block visibility", () => {
  test.each([
    [undefined, false],
    [" ", false],
    ["-", false],
    ["x", true],
    ["X", true],
  ])("recognizes completion marker %s", (marker, expected) => {
    expect(isCompleted(marker)).toBe(expected);
  });

  test("hides only completed checkbox time blocks", () => {
    const timeBlocks = [
      { ...baseTimeBlock, id: "plain", status: undefined },
      {
        ...baseTimeBlock,
        id: "unchecked",
        task: " ",
        startTime: baseTimeBlock.startTime.clone().add(1, "hour"),
      },
      {
        ...baseTimeBlock,
        id: "custom",
        task: "-",
        startTime: baseTimeBlock.startTime.clone().add(2, "hours"),
      },
      {
        ...baseTimeBlock,
        id: "completed-lower",
        task: "x",
        startTime: baseTimeBlock.startTime.clone().add(3, "hours"),
      },
      {
        ...baseTimeBlock,
        id: "completed-status-only",
        status: "X",
        task: undefined,
        startTime: baseTimeBlock.startTime.clone().add(4, "hours"),
      },
    ];
    const { getDisplayedTimeBlocksForTimeline } = setUp({
      timeBlocks,
      settings: {
        ...defaultSettingsForTests,
        showCompletedTasks: false,
      },
    });

    const displayed = get(getDisplayedTimeBlocksForTimeline(day));

    expect(displayed.withTime.map(({ id }) => id).sort()).toEqual([
      "custom",
      "plain",
      "unchecked",
    ]);
  });
});
