import { get } from "svelte/store";
import { describe, expect, test } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import type {
  EditableTimeBlock,
  RemoteTimeBlock,
} from "../../src/time-block-types";

import { baseTimeBlock, day, nextDay } from "./util/fixtures";
import { setUp } from "./util/setup";

describe("planner status filtering", () => {
  test.each(["dailyNoteDate", "tasksPluginProp"] as const)(
    "updates timed and all-day %s tasks in every view without changing source data",
    (source) => {
      const timeBlocks: EditableTimeBlock[] = [
        { ...baseTimeBlock, id: "cancelled", source, task: "-" },
        {
          ...baseTimeBlock,
          id: "cancelled-all-day",
          source,
          task: "-",
          isAllDayEvent: true,
        },
        { ...baseTimeBlock, id: "progress", source, task: "/" },
        { ...baseTimeBlock, id: "todo", source, task: " " },
        { ...baseTimeBlock, id: "done", source, task: "x" },
        { ...baseTimeBlock, id: "custom", source, status: "?" },
        { ...baseTimeBlock, id: "plain", source, status: undefined },
        {
          ...baseTimeBlock,
          id: "tomorrow",
          source,
          task: "-",
          startTime: nextDay,
        },
      ].map((block, line) => ({
        ...block,
        source,
        path: "path",
        text: block.id,
        position: {
          start: { line, col: 0, offset: line },
          end: { line, col: 1, offset: line + 1 },
        },
      }));
      const original = JSON.stringify(timeBlocks);
      const remote: RemoteTimeBlock & { durationMinutes: number } = {
        source: "ical",
        id: "remote",
        startTime: day,
        summary: "Remote event",
        durationMinutes: 30,
        calendar: {
          name: "Test",
          url: "https://example.com",
          color: "#000000",
        },
        rsvpStatus: "DECLINED",
      };
      const {
        props,
        dayToDisplayedTimeBlocks,
        getDisplayedTimeBlocksForTimeline,
        getDisplayedAllDayTimeBlocksForMultiDayRow,
      } = setUp({ timeBlocks, remoteTimeBlocks: [remote] });
      const timeline = getDisplayedTimeBlocksForTimeline(day);
      const ids = () =>
        Object.values(get(dayToDisplayedTimeBlocks)).flatMap(
          ({ withTime, noTime }) =>
            [...withTime, ...noTime].map(({ id }) => id),
        );

      expect(ids()).toHaveLength(9);
      props.settingsStore.update((settings) => ({
        ...settings,
        hiddenTaskStatuses: ["-", "?"],
      }));
      expect(ids().sort()).toEqual([
        "done",
        "plain",
        "progress",
        "remote",
        "todo",
      ]);
      expect(
        get(timeline)
          .withTime.map(({ id }) => id)
          .sort(),
      ).toEqual(ids().sort());
      expect(get(timeline).noTime).toEqual([]);
      expect(
        get(getDisplayedAllDayTimeBlocksForMultiDayRow)({
          start: day,
          end: nextDay,
        }),
      ).toEqual([]);
      expect(JSON.stringify(get(props.localTimeBlocks))).toBe(original);

      props.settingsStore.update((settings) => ({
        ...settings,
        showCompletedTasks: false,
      }));
      expect(ids()).not.toContain("done");
      props.settingsStore.update((settings) => ({
        ...settings,
        showCompletedTasks: true,
        hiddenTaskStatuses: ["x", " "],
      }));
      expect(ids()).not.toContain("done");
      expect(ids()).not.toContain("todo");
      expect(ids()).toContain("plain");
      props.settingsStore.set(defaultSettingsForTests);
      expect(ids()).toHaveLength(9);
    },
  );
});
