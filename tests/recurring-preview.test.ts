import { RRule } from "rrule";
import { describe, expect, test } from "vitest";

import {
  filesIndexed,
  type ListItemEntry,
  type PlanEntry,
} from "../src/redux/index/index-slice";
import { createRecurringPreviewSelector } from "../src/redux/index/recurring-preview-selectors";
import { settingsUpdated } from "../src/redux/settings-slice";
import { makeStore } from "../src/redux/store";
import { mergeStoredSettings } from "../src/settings";
import type { PlanTimeBlock } from "../src/time-block-types";
import {
  getRecurringPreviewForDay,
  prepareRecurringSource,
} from "../src/util/recurring-preview";

function block(
  rule = "every day",
  start = "2026-11-06 15:00",
  overrides: Partial<PlanTimeBlock> = {},
): PlanTimeBlock {
  return {
    id: "task",
    path: "Recurring.md",
    source: "tasksPluginProp",
    symbol: "-",
    task: " ",
    text: `15:00 - 17:00 Focus 🔁 ${rule} ⏳ ${start.slice(0, 10)}`,
    startTime: window.moment(start),
    durationMinutes: 120,
    position: {
      start: { line: 0, col: 0, offset: 0 },
      end: { line: 0, col: 80, offset: 80 },
    },
    ...overrides,
  };
}

function preview(rule: string, start: string, day: string) {
  const source = prepareRecurringSource(block(rule, `${start} 15:00`));
  expect(source).toBeDefined();
  return getRecurringPreviewForDay(source!, day);
}

describe("recurring task previews", () => {
  test("is opt-in for old and new installations", () => {
    expect(mergeStoredSettings(null).showRecurringTaskPreviews).toBe(false);
    expect(
      mergeStoredSettings({ showRecurringTaskPreviews: true })
        .showRecurringTaskPreviews,
    ).toBe(true);
  });

  test.each([
    ["every day", "2026-11-06", "2026-11-07", true],
    ["every day", "2026-11-06", "2026-11-06", false],
    ["every 2 days", "2026-11-06", "2026-11-07", false],
    ["every 2 days", "2026-11-06", "2026-11-08", true],
    ["every week", "2026-11-06", "2026-11-13", true],
    ["every 2 weeks on Monday, Friday", "2026-11-06", "2026-11-09", false],
    ["every 2 weeks on Monday, Friday", "2026-11-06", "2026-11-16", true],
    ["every weekday", "2026-11-06", "2026-11-07", false],
    ["every weekday", "2026-11-06", "2026-11-09", true],
    ["every month", "2026-01-31", "2026-02-28", true],
    ["every month", "2026-01-31", "2026-03-28", true],
    ["every month", "2026-01-31", "2026-03-31", false],
    ["every month on the 31st", "2026-01-31", "2026-02-28", false],
    ["every month on the 31st", "2026-01-31", "2026-03-31", true],
    ["every month on the last Friday", "2026-01-30", "2026-02-27", true],
    ["every year", "2024-02-29", "2025-02-28", true],
    ["every year", "2024-02-29", "2028-02-28", true],
    ["every day until November 8, 2026", "2026-11-06", "2026-11-09", false],
    ["every 3 days", "1900-01-01", "2099-12-30", true],
  ])("%s from %s on %s: %s", (rule, start, day, expected) => {
    expect(preview(rule, start, day).length > 0).toBe(expected);
  });

  test.each([
    "every day when done",
    "every 0 days",
    "every hour",
    "every day for 3 times",
    "not a rule",
    "every 999999999 days",
  ])("skips unsupported or invalid rule %s", (rule) => {
    expect(prepareRecurringSource(block(rule))).toBeUndefined();
  });

  test("uses the due date as reference and preserves the scheduled offset", () => {
    const source = prepareRecurringSource(
      block("every month on the 10th", "2026-10-08 15:00", {
        text: "15:00 - 17:00 Report 🔁 every month on the 10th ⏳ 2026-10-08 📅 2026-10-10",
      }),
    )!;
    expect(getRecurringPreviewForDay(source, "2026-11-08")[0]?.title).toBe(
      "Report",
    );
    expect(getRecurringPreviewForDay(source, "2026-11-10")).toEqual([]);
  });

  test("supports inline recurrence fields and daily-note dates without writing to the source", () => {
    const original = block("every day", "2026-11-06 15:00", {
      source: "dailyNoteDate",
      text: "15:00 - 17:00 Focus [repeat:: every day]",
    });
    const before = JSON.stringify(original);
    const source = prepareRecurringSource(original)!;
    expect(
      getRecurringPreviewForDay(source, "2026-11-07")[0]?.startTime.format(
        "YYYY-MM-DD HH:mm",
      ),
    ).toBe("2026-11-07 15:00");
    expect(JSON.stringify(original)).toBe(before);
    expect(
      prepareRecurringSource({ ...original, task: undefined }),
    ).toBeUndefined();
  });

  test("splits an overnight preview at midnight", () => {
    const source = prepareRecurringSource(
      block("every day", "2026-11-06 23:30"),
    )!;
    const occurrences = getRecurringPreviewForDay(source, "2026-11-08");
    expect(
      occurrences.map((item) => [
        item.startTime.format("HH:mm"),
        item.durationMinutes,
      ]),
    ).toEqual([
      ["00:00", 90],
      ["23:30", 30],
    ]);
  });

  test("keeps local wall-clock time across daylight-saving boundaries", () => {
    const source = prepareRecurringSource(
      block("every day", "2026-03-07 15:00"),
    )!;
    const next = getRecurringPreviewForDay(source, "2026-03-08")[0]!;
    expect(next.startTime.format("YYYY-MM-DD HH:mm")).toBe("2026-03-08 15:00");
    expect(next.durationMinutes).toBe(120);
    const overnight = prepareRecurringSource(
      block("every day", "2026-03-06 23:30", { durationMinutes: 240 }),
    )!;
    const morning = getRecurringPreviewForDay(overnight, "2026-03-08")[0]!;
    expect(
      morning.startTime
        .clone()
        .add(morning.durationMinutes, "minutes")
        .format("HH:mm"),
    ).toBe("03:30");
  });

  test.each([
    "every 3 days",
    "every 2 weeks on Monday, Friday",
    "every 2 months on the 15th",
    "every year on the first Monday of February",
  ])("bounded lookup agrees with full recurrence expansion: %s", (ruleText) => {
    const start = "2024-01-12";
    const source = prepareRecurringSource(block(ruleText, `${start} 15:00`))!;
    const rule = new RRule({
      ...RRule.parseText(ruleText),
      dtstart: new Date(`${start}T00:00:00Z`),
    });
    const expected = new Set(
      rule
        .between(
          new Date("2026-01-01T00:00:00Z"),
          new Date("2026-03-31T23:59:59Z"),
          true,
        )
        .map((date) => date.toISOString().slice(0, 10)),
    );
    const actual = new Set<string>();
    for (
      const day = window.moment("2026-01-01");
      day.isBefore("2026-04-01");
      day.add(1, "day")
    ) {
      const dayKey = day.format("YYYY-MM-DD");
      if (getRecurringPreviewForDay(source, dayKey).length) actual.add(dayKey);
    }
    expect(actual).toEqual(expected);
  });
});

function indexBlocks(blocks: PlanTimeBlock[]) {
  const listItemEntries: ListItemEntry[] = blocks.map((item) => ({
    id: `${item.id}:parent`,
    text: item.text,
    path: item.path,
    task: item.task,
    symbol: item.symbol,
    position: item.position,
    planEntryIds: [item.id],
  }));
  const planEntries: PlanEntry[] = blocks.map((item) => ({
    id: item.id,
    parentId: `${item.id}:parent`,
    start: item.startTime.format(),
    end: item.startTime.clone().add(item.durationMinutes, "minutes").format(),
    dayKeys: [item.startTime.format("YYYY-MM-DD")],
    source: item.source,
    isAllDay: item.isAllDayEvent,
  }));
  return [{ path: "Recurring.md", listItemEntries, planEntries }];
}

describe("preview selection and caching", () => {
  test("keeps intermediate previews when a distant occurrence is materialized", () => {
    const store = makeStore({});
    const select = createRecurringPreviewSelector();
    store.dispatch(settingsUpdated({ showRecurringTaskPreviews: true }));
    store.dispatch(
      filesIndexed(
        indexBlocks([
          block(),
          block("every day", "2026-11-10 15:00", { id: "early" }),
        ]),
      ),
    );
    expect(select(store.getState(), "2026-11-07")[0]?.source.id).toBe("task");
    expect(select(store.getState(), "2026-11-09")).toHaveLength(1);
    expect(select(store.getState(), "2026-11-10")).toEqual([]);
    expect(select(store.getState(), "2026-11-11")[0]?.source.id).toBe("early");
  });

  test("previews all-day tasks separately and replaces them with actual occurrences", () => {
    const store = makeStore({});
    const select = createRecurringPreviewSelector();
    store.dispatch(settingsUpdated({ showRecurringTaskPreviews: true }));
    const allDay = block("every day", "2026-11-06 00:00", {
      id: "all-day",
      text: "Focus 🔁 every day ⏳ 2026-11-06",
      isAllDayEvent: true,
      durationMinutes: 60,
    });
    store.dispatch(filesIndexed(indexBlocks([allDay, block()])));
    expect(select(store.getState(), "2026-11-06")).toEqual([]);
    const previews = select(store.getState(), "2026-11-07");
    expect(previews.map((item) => item.isAllDay)).toEqual([true, false]);
    expect(previews[0]?.startTime.format("YYYY-MM-DD HH:mm")).toBe(
      "2026-11-07 00:00",
    );
    expect(previews[0]?.title).toBe("Focus");
    // An all-day entry's synthetic duration must not split the same series.
    const next = {
      ...allDay,
      id: "next",
      startTime: window.moment("2026-11-07"),
      durationMinutes: 30,
      text: "Focus 🔁 every day ⏳ 2026-11-07",
    };
    store.dispatch(filesIndexed(indexBlocks([allDay, next, block()])));
    expect(
      select(store.getState(), "2026-11-07").map((item) => item.isAllDay),
    ).toEqual([false]);
    expect(
      select(store.getState(), "2026-11-08").filter((item) => item.isAllDay),
    ).toHaveLength(1);
    for (const task of ["x", "X", "-"]) {
      store.dispatch(filesIndexed(indexBlocks([{ ...allDay, task }])));
      expect(select(store.getState(), "2026-11-07")).toEqual([]);
    }
    store.dispatch(filesIndexed(indexBlocks([allDay])));
    store.dispatch(settingsUpdated({ hiddenTaskStatuses: [" "] }));
    expect(select(store.getState(), "2026-11-07")).toEqual([]);
    store.dispatch(
      settingsUpdated({
        hiddenTaskStatuses: [],
        showRecurringTaskPreviews: false,
      }),
    );
    expect(select(store.getState(), "2026-11-07")).toEqual([]);
  });

  test("updates on source edits, respects hidden/completed statuses and stays outside editable blocks", () => {
    const store = makeStore({});
    const select = createRecurringPreviewSelector();
    store.dispatch(filesIndexed(indexBlocks([block()])));
    const originalIndex = JSON.stringify(store.getState().tracker);
    expect(select(store.getState(), "2026-11-07")).toEqual([]);
    store.dispatch(settingsUpdated({ showRecurringTaskPreviews: true }));
    expect(select(store.getState(), "2026-11-07")).toHaveLength(1);
    expect(JSON.stringify(store.getState().tracker)).toBe(originalIndex);
    const result = select(store.getState(), "2026-11-07");
    const count = select.recomputations();
    store.dispatch(
      settingsUpdated({ zoomLevel: 4, showCompletedTasks: false }),
    );
    expect(select(store.getState(), "2026-11-07")).toBe(result);
    expect(select.recomputations()).toBe(count);
    store.dispatch(settingsUpdated({ hiddenTaskStatuses: [" "] }));
    expect(select(store.getState(), "2026-11-07")).toEqual([]);
    store.dispatch(settingsUpdated({ hiddenTaskStatuses: [] }));
    for (const task of ["x", "X", "-"]) {
      store.dispatch(
        filesIndexed(
          indexBlocks([block("every day", "2026-11-06 15:00", { task })]),
        ),
      );
      expect(select(store.getState(), "2026-11-07")).toEqual([]);
    }
    store.dispatch(filesIndexed(indexBlocks([block("every week")])));
    expect(select(store.getState(), "2026-11-07")).toEqual([]);
    expect(select(store.getState(), "2026-11-13")).toHaveLength(1);
  });

  test("deduplicates a series and replaces previews with real occurrences", () => {
    const store = makeStore({});
    const select = createRecurringPreviewSelector();
    store.dispatch(settingsUpdated({ showRecurringTaskPreviews: true }));
    store.dispatch(
      filesIndexed(
        indexBlocks([
          block(),
          block("every day", "2026-11-07 15:00", { id: "next" }),
        ]),
      ),
    );
    expect(select(store.getState(), "2026-11-07")).toEqual([]);
    expect(select(store.getState(), "2026-11-08")).toHaveLength(1);
    store.dispatch(settingsUpdated({ showRecurringTaskPreviews: false }));
    expect(select(store.getState(), "2026-11-08")).toEqual([]);
  });

  test("reuses results when visiting the same visible dates with a large old task set", () => {
    const store = makeStore({});
    const select = createRecurringPreviewSelector();
    const tasks = Array.from({ length: 1000 }, (_, i) =>
      block("every day", "1900-01-01 15:00", {
        id: String(i),
        text: `15:00 - 17:00 Task ${i} 🔁 every day ⏳ 1900-01-01`,
      }),
    );
    store.dispatch(filesIndexed(indexBlocks(tasks)));
    store.dispatch(settingsUpdated({ showRecurringTaskPreviews: true }));
    const days = [
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
    ];
    const start = performance.now();
    const results = days.map((day) => select(store.getState(), day));
    const cold = performance.now() - start;
    const count = select.recomputations();
    const warmStart = performance.now();
    for (let i = 0; i < 100; i++)
      days.forEach((day, index) =>
        expect(select(store.getState(), day)).toBe(results[index]),
      );
    expect(select.recomputations()).toBe(count);
    expect(results.every((items) => items.length === 1000)).toBe(true);
    console.info(
      `Recurring preview benchmark: 1000 tasks / 7 days: ${cold.toFixed(1)}ms cold; 700 cached reads: ${(performance.now() - warmStart).toFixed(1)}ms`,
    );
  });
});
