import { describe, expect, test, vi } from "vitest";

import { getAvailableTimelineColumns } from "../src/global-store/derived-settings";
import { defaultSettings } from "../src/settings";
import {
  createTimeTrackerCommandCheck,
  createTimeTrackerViewSynchronizer,
  getTimeTrackerDisableConfirmation,
} from "../src/ui/time-tracker-availability";

describe("time tracker availability", () => {
  test("is enabled by default", () => {
    expect(defaultSettings.enableTimeTracker).toBe(true);
  });

  test("uses only the planner column while disabled without losing the saved selection", () => {
    const timelineColumns = { planner: false, timeTracker: true };
    const settings = {
      ...defaultSettings,
      enableTimeTracker: false,
      timelineColumns,
    };

    expect(getAvailableTimelineColumns(settings)).toEqual({
      planner: true,
      timeTracker: false,
    });
    expect(settings.timelineColumns).toBe(timelineColumns);

    expect(
      getAvailableTimelineColumns({
        ...settings,
        enableTimeTracker: true,
      }),
    ).toBe(timelineColumns);
  });

  test("opens and detaches tracker views in requested order", async () => {
    const calls: string[] = [];
    let finishOpening: () => void = () => undefined;
    const opening = new Promise<void>((resolve) => {
      finishOpening = resolve;
    });
    const synchronizer = createTimeTrackerViewSynchronizer({
      openSilently: async () => {
        calls.push("open:start");
        await opening;
        calls.push("open:end");
      },
      detach: async () => {
        calls.push("detach");
      },
    });

    const enable = synchronizer.sync(true);
    const disable = synchronizer.sync(false);
    const reenable = synchronizer.sync(true);

    await vi.waitFor(() => {
      expect(calls).toEqual(["open:start"]);
    });

    finishOpening();
    await Promise.all([enable, disable, reenable]);

    expect(calls).toEqual([
      "open:start",
      "open:end",
      "detach",
      "open:start",
      "open:end",
    ]);
  });

  test("queues feature disabling after an in-flight command opens a view", async () => {
    const calls: string[] = [];
    let finishCommand: () => void = () => undefined;
    const commandPending = new Promise<void>((resolve) => {
      finishCommand = resolve;
    });
    const synchronizer = createTimeTrackerViewSynchronizer({
      openSilently: async () => {
        calls.push("open:silent");
      },
      detach: async () => {
        calls.push("detach");
      },
    });

    const command = synchronizer.enqueue(async () => {
      calls.push("open:command:start");
      await commandPending;
      calls.push("open:command:end");
    });
    const disable = synchronizer.sync(false);

    await vi.waitFor(() => {
      expect(calls).toEqual(["open:command:start"]);
    });

    finishCommand();
    await Promise.all([command, disable]);

    expect(calls).toEqual(["open:command:start", "open:command:end", "detach"]);
  });

  test("hides commands while disabled and executes them only after checking", () => {
    let enabled = false;
    const execute = vi.fn();
    const check = createTimeTrackerCommandCheck({
      execute,
      isEnabled: () => enabled,
    });

    expect(check(false)).toBe(false);
    expect(execute).not.toHaveBeenCalled();

    enabled = true;

    expect(check(true)).toBe(true);
    expect(execute).not.toHaveBeenCalled();
    expect(check(false)).toBe(true);
    expect(execute).toHaveBeenCalledOnce();
  });

  test("does not interrupt disabling when no clock is active", () => {
    expect(getTimeTrackerDisableConfirmation(0)).toBeUndefined();
  });

  test("warns that one active clock remains open while controls are hidden", () => {
    expect(getTimeTrackerDisableConfirmation(1)).toEqual({
      cta: "Disable",
      text: "1 active clock is still running. Its record will remain open, but clock controls will be hidden until you enable Time Tracker again.",
      title: "Disable Time Tracker?",
      variant: "warning",
    });
  });

  test("uses plural wording for multiple active clocks", () => {
    expect(getTimeTrackerDisableConfirmation(2)?.text).toContain(
      "2 active clocks are still running",
    );
  });
});
