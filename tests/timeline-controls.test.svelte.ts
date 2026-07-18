import { flushSync, mount, unmount } from "svelte";
import { writable } from "svelte/store";
import { afterEach, describe, expect, test, vi } from "vitest";

import { dateRangeContextKey, obsidianContextKey } from "../src/constants";
import { settings } from "../src/global-store/settings";
import { defaultSettingsForTests } from "../src/settings";
import type { ObsidianContext } from "../src/types";
import TimelineControls from "../src/ui/components/timeline-controls.svelte";

afterEach(() => {
  settings.set(defaultSettingsForTests);
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("TimelineControls settings", () => {
  test("shows the settings panel and active state after clicking Settings", async () => {
    const target = document.createElement("div");
    const context = new Map<string, unknown>([
      [dateRangeContextKey, writable([window.moment("2026-07-18")])],
      [
        obsidianContextKey,
        {
          workspaceFacade: {
            openFileInEditor: vi.fn(),
          },
          periodicNotes: {
            createDailyNoteIfNeeded: vi.fn(),
          },
          initWeeklyView: vi.fn(),
          reSync: vi.fn(),
          settings,
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);
    settings.set(defaultSettingsForTests);

    const component = mount(TimelineControls, { context, target });

    flushSync();

    const settingsButton = target.querySelector<HTMLElement>(
      '[aria-label="Settings"]',
    );
    const controls = target.querySelector<HTMLElement>(
      ".planner-timeline-controls",
    );

    expect(settingsButton).not.toBeNull();
    expect(controls).not.toBeNull();
    expect(settingsButton!.classList.contains("is-active")).toBe(false);
    expect(controls!.classList.contains("settings-visible")).toBe(false);
    expect(target.querySelector(".settings-wrapper")).toBeNull();

    settingsButton!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    flushSync();

    expect(settingsButton!.classList.contains("is-active")).toBe(true);
    expect(controls!.classList.contains("settings-visible")).toBe(true);
    expect(
      target.querySelector(".settings-wrapper > .settings"),
    ).not.toBeNull();

    unmount(component);
    flushSync();
  });
});
