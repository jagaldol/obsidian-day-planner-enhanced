import { beforeEach, expect, test, vi } from "vitest";

const { callbacks, notice } = vi.hoisted(() => ({
  callbacks: new Map<string, () => unknown>(),
  notice: vi.fn(),
}));
vi.mock("obsidian", () => ({
  Notice: notice,
  Menu: class {
    addItem(build: (item: unknown) => unknown) {
      let title = "";
      const item = {
        setTitle(value: string) {
          title = value;
          return item;
        },
        setIcon() {
          return item;
        },
        onClick(callback: () => unknown) {
          callbacks.set(title, callback);
          return item;
        },
      };
      build(item);
      return this;
    }
    showAtMouseEvent() {}
  },
}));

import type { WorkspaceFacade } from "../src/service/workspace-facade";
import type { PlanTimeBlock } from "../src/time-block-types";
import { createRecurringPreviewMenu } from "../src/ui/recurring-preview-menu";
import type { RecurringPreview } from "../src/util/recurring-preview";

beforeEach(() => {
  callbacks.clear();
  notice.mockClear();
});

function setup(confirmed = false) {
  const preview = {
    title: "Focus",
    occurrenceDay: "2026-11-08",
    source: { path: "Note.md" } as PlanTimeBlock,
  } as RecurringPreview;
  const revealLocation = vi.fn().mockResolvedValue(undefined);
  const createRecurringOccurrence = vi.fn().mockResolvedValue(undefined);
  const confirmAction = vi.fn().mockResolvedValue(confirmed);
  const event = new MouseEvent("contextmenu", { cancelable: true });
  createRecurringPreviewMenu(event, preview, {
    workspaceFacade: { revealLocation } as unknown as WorkspaceFacade,
    createRecurringOccurrence,
    confirmAction,
  });
  return {
    preview,
    revealLocation,
    createRecurringOccurrence,
    confirmAction,
    event,
  };
}

test("opens the original without creating anything", async () => {
  const state = setup();
  expect(state.event.defaultPrevented).toBe(true);
  expect([...callbacks.keys()]).toEqual([
    "Open original task",
    "Create task early…",
  ]);
  await callbacks.get("Open original task")!();
  expect(state.revealLocation).toHaveBeenCalledWith(state.preview.source);
  expect(state.createRecurringOccurrence).not.toHaveBeenCalled();
});

test.each([false, true])(
  "creates only after explicit confirmation: %s",
  async (confirmed) => {
    const state = setup(confirmed);
    expect(state.createRecurringOccurrence).not.toHaveBeenCalled();
    await callbacks.get("Create task early…")!();
    expect(state.confirmAction).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "warning",
        cta: "Create early",
        text: expect.stringContaining("may create a duplicate"),
      }),
    );
    expect(state.createRecurringOccurrence).toHaveBeenCalledTimes(
      confirmed ? 1 : 0,
    );
    if (confirmed)
      expect(state.createRecurringOccurrence).toHaveBeenCalledWith(
        state.preview,
      );
  },
);

test("reports a stale/duplicate occurrence without claiming success", async () => {
  const state = setup(true);
  state.createRecurringOccurrence.mockRejectedValue(
    new Error("already exists"),
  );
  await callbacks.get("Create task early…")!();
  expect(notice).toHaveBeenCalledWith("Error: already exists");
  expect(notice).not.toHaveBeenCalledWith("Task created");
});
