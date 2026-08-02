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

    unmount(component);
    flushSync();
  });
});
