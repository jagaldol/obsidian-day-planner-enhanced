import { flushSync, mount, unmount } from "svelte";
import { writable } from "svelte/store";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  dateRangeContextKey,
  isInSidebarContextKey,
  obsidianContextKey,
} from "../src/constants";
import { settingsStore } from "../src/global-store/settings";
import type { DateRange } from "../src/redux/date-ranges";
import { defaultSettingsForTests } from "../src/settings";
import type { ObsidianContext } from "../src/types";
import TimelineControls from "../src/ui/components/timeline-controls.svelte";

afterEach(() => {
  settingsStore.set(defaultSettingsForTests);
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("TimelineControls navigation", () => {
  test("moves the selected date one day with the navigation buttons", () => {
    const target = document.createElement("div");
    const selectedDay = window.moment("2026-07-18");
    const set = vi.fn();
    const dateRange: DateRange = {
      current: [selectedDay],
      first: selectedDay,
      last: selectedDay,
      set,
      update: vi.fn(),
      untrack: vi.fn(),
    };
    const context = new Map<string, unknown>([
      [dateRangeContextKey, dateRange],
      [isInSidebarContextKey, writable(false)],
      [
        obsidianContextKey,
        {
          workspaceFacade: {
            openFileForDay: vi.fn(),
            openFileInEditor: vi.fn(),
          },
          periodicNotes: {
            createDailyNoteIfNeeded: vi.fn(),
          },
          initWeeklyView: vi.fn(),
          openTimelineSettingsModal: vi.fn(),
          reSync: vi.fn(),
          settingsStore,
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);

    const component = mount(TimelineControls, { context, target });

    flushSync();

    target
      .querySelector<HTMLElement>('[aria-label="Go to previous day"]')
      ?.click();
    target
      .querySelector<HTMLElement>('[aria-label="Go to next day"]')
      ?.click();

    expect(
      set.mock.calls.map(([days]) => days[0].format("YYYY-MM-DD")),
    ).toEqual(["2026-07-17", "2026-07-19"]);

    unmount(component);
    flushSync();
  });

  test("shows the week strip but leaves regular-tab actions to the pane menu", () => {
    const target = document.createElement("div");
    const selectedDay = window.moment("2026-07-18");
    const set = vi.fn();
    const dateRange: DateRange = {
      current: [selectedDay],
      first: selectedDay,
      last: selectedDay,
      set,
      update: vi.fn(),
      untrack: vi.fn(),
    };
    const context = new Map<string, unknown>([
      [dateRangeContextKey, dateRange],
      [isInSidebarContextKey, writable(false)],
      [
        obsidianContextKey,
        {
          workspaceFacade: {
            openFileForDay: vi.fn(),
            openFileInEditor: vi.fn(),
          },
          periodicNotes: {
            createDailyNoteIfNeeded: vi.fn(),
          },
          initWeeklyView: vi.fn(),
          openTimelineSettingsModal: vi.fn(),
          reSync: vi.fn(),
          settingsStore,
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);
    settingsStore.set(defaultSettingsForTests);

    const component = mount(TimelineControls, { context, target });

    flushSync();

    expect(target.querySelectorAll(".day-of-month")).toHaveLength(7);
    expect(target.querySelector('[aria-label="More options"]')).toBeNull();

    const nextDayButton = target.querySelector<HTMLElement>(
      '[aria-label="Sunday, July 19"]',
    );

    expect(nextDayButton).not.toBeNull();
    nextDayButton!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(set).toHaveBeenCalledTimes(1);
    expect(set.mock.calls[0]?.[0]?.[0]?.format("YYYY-MM-DD")).toBe(
      "2026-07-19",
    );

    settingsStore.set({
      ...defaultSettingsForTests,
      firstDayOfWeek: "sunday",
    });
    flushSync();

    const reorderedDayLabels = Array.from(
      target.querySelectorAll<HTMLElement>(".day-of-month-button"),
      (element) => element.getAttribute("aria-label"),
    );

    expect(reorderedDayLabels[0]).toBe("Sunday, July 12");
    expect(reorderedDayLabels.at(-1)).toBe("Saturday, July 18");

    const firstDayButton = target.querySelector<HTMLElement>(
      '[aria-label="Sunday, July 12"]',
    );

    expect(firstDayButton).not.toBeNull();
    firstDayButton!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(set.mock.calls.at(-1)?.[0]?.[0]?.format("YYYY-MM-DD")).toBe(
      "2026-07-12",
    );

    unmount(component);
    flushSync();
  });

  test("keeps the selected date visible while its note is opening", async () => {
    const target = document.createElement("div");
    const selectedDay = window.moment("2026-07-18");
    let finishCreatingNote: ((note: unknown) => void) | undefined;
    const createDailyNoteIfNeeded = vi.fn(
      () =>
        new Promise((resolve) => {
          finishCreatingNote = resolve;
        }),
    );
    const openFileInEditor = vi.fn(async () => {});
    const dateRange: DateRange = {
      current: [selectedDay],
      first: selectedDay,
      last: selectedDay,
      set: vi.fn(),
      update: vi.fn(),
      untrack: vi.fn(),
    };
    const context = new Map<string, unknown>([
      [dateRangeContextKey, dateRange],
      [isInSidebarContextKey, writable(false)],
      [
        obsidianContextKey,
        {
          workspaceFacade: {
            openFileForDay: vi.fn(),
            openFileInEditor,
          },
          periodicNotes: { createDailyNoteIfNeeded },
          initWeeklyView: vi.fn(),
          openTimelineSettingsModal: vi.fn(),
          reSync: vi.fn(),
          settingsStore,
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);

    const component = mount(TimelineControls, { context, target });

    flushSync();

    const selectedDayButton = target.querySelector<HTMLElement>(
      '[aria-label="Saturday, July 18"]',
    );

    selectedDayButton?.click();
    await Promise.resolve();
    flushSync();

    expect(selectedDayButton?.getAttribute("aria-busy")).toBe("true");
    expect(selectedDayButton?.textContent?.trim()).toBe("18");
    expect(selectedDayButton?.querySelector(".is-pending")).toBeNull();
    expect(selectedDayButton?.querySelector(".pending-indicator")).toBeNull();

    finishCreatingNote?.({ path: "2026-07-18.md" });
    await Promise.resolve();
    await Promise.resolve();
    flushSync();

    expect(openFileInEditor).toHaveBeenCalledOnce();
    expect(selectedDayButton?.querySelector(".pending-indicator")).toBeNull();
    expect(selectedDayButton?.textContent?.trim()).toBe("18");

    unmount(component);
    flushSync();
  });
});
