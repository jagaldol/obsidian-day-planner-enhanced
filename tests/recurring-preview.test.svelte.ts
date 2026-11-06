import { flushSync, mount, unmount } from "svelte";
import { expect, test, vi } from "vitest";

import { layoutRecurringPreviews } from "../src/overlap/recurring-preview-layout";
import { selectRecurringPreviewsForDay } from "../src/redux/index/recurring-preview-selectors";
import { obsidianContextKey } from "../src/constants";
import { filesIndexed } from "../src/redux/index/index-slice";
import { settingsUpdated } from "../src/redux/settings-slice";
import { makeStore } from "../src/redux/store";
import { createUseSelector } from "../src/redux/use-selector";
import RecurringAllDayPreviews from "../src/ui/components/recurring-all-day-previews.svelte";
import RecurringTaskPreviews from "../src/ui/components/recurring-task-previews.svelte";

const { showMenu } = vi.hoisted(() => ({ showMenu: vi.fn() }));
vi.mock("../src/ui/recurring-preview-menu", () => ({
  createRecurringPreviewMenu: showMenu,
}));

vi.mock("../src/global-store/current-time", () => ({
  currentTimeSignal: {
    get current() {
      return window.moment("2026-11-07");
    },
  },
}));

test.each([false, true])(
  "renders a read-only preview (all-day: %s) and reacts to disabling without changing the index",
  async (allDay) => {
    const store = makeStore({});
    store.dispatch(settingsUpdated({ showRecurringTaskPreviews: true }));
    store.dispatch(
      filesIndexed([
        {
          path: "Recurring.md",
          listItemEntries: [
            {
              id: "parent",
              path: "Recurring.md",
              text: `${allDay ? "" : "15:00 - 17:00 "}<img src=x> Focus 🔁 every day ⏳ 2026-11-06`,
              task: " ",
              symbol: "-",
              planEntryIds: ["plan"],
              position: {
                start: { line: 0, col: 0, offset: 0 },
                end: { line: 0, col: 80, offset: 80 },
              },
            },
          ],
          planEntries: [
            {
              id: "plan",
              parentId: "parent",
              source: "tasksPluginProp",
              start: allDay ? "2026-11-06T00:00" : "2026-11-06T15:00",
              isAllDay: allDay,
              end: "2026-11-06T17:00",
              dayKeys: ["2026-11-06"],
            },
          ],
        },
      ]),
    );
    showMenu.mockClear();
    const index = store.getState().tracker;
    const target = document.createElement("div");
    document.body.appendChild(target);
    const layout = layoutRecurringPreviews(
      [
        {
          id: "actual",
          startTime: window.moment("2026-11-07 15:30"),
          durationMinutes: 60,
          placing: { spanPercent: 100, offsetPercent: 0 },
        },
      ],
      selectRecurringPreviewsForDay(store.getState(), "2026-11-07"),
    );
    const component = mount(
      allDay ? RecurringAllDayPreviews : RecurringTaskPreviews,
      {
        target,
        props: {
          dayKey: "2026-11-07",
          ...(!allDay ? { placings: layout.previewPlacings } : {}),
        },
        context: new Map([
          [
            obsidianContextKey,
            {
              useSelector: createUseSelector(store),
              settingsSignal: {
                get current() {
                  return store.getState().settings.settings;
                },
              },
            },
          ],
        ]),
      },
    );
    flushSync();
    expect(target.querySelectorAll('[role="note"]')).toHaveLength(1);
    expect(target.textContent).toContain("<img src=x> Focus");
    expect(target.textContent).not.toContain("Preview");
    expect(
      target.querySelector("input, button, img, a, [draggable=true]"),
    ).toBeNull();
    if (allDay) {
      expect(target.textContent).not.toContain("00:00");
      expect(target.querySelector(".recurring-preview")).toBeNull();
    } else {
      expect(
        target.querySelector<HTMLElement>(".recurring-preview")?.style.height,
      ).toBe("240px");
      expect(target.querySelector(".recurring-all-day-preview")).toBeNull();
      expect(
        target.querySelector<HTMLElement>(".recurring-preview")?.style.width,
      ).toBe("50%");
      expect(
        target.querySelector<HTMLElement>(".recurring-preview")?.style.left,
      ).toBe("0%");
      expect(layout.realBlocks[0]?.placing.offsetPercent).toBe(50);
    }
    const previewElement = target.querySelector<HTMLElement>('[role="note"]')!;
    previewElement.click();
    expect(showMenu).not.toHaveBeenCalled();
    const pointerEvent = new MouseEvent("pointerdown", { bubbles: true });
    const stopPropagation = vi.spyOn(pointerEvent, "stopPropagation");
    previewElement.dispatchEvent(pointerEvent);
    expect(stopPropagation).toHaveBeenCalled();
    previewElement.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true }),
    );
    expect(showMenu).toHaveBeenCalledTimes(1);
    expect(showMenu.mock.calls[0]?.[1]).toMatchObject({
      occurrenceDay: "2026-11-07",
      isAllDay: allDay,
    });
    store.dispatch(settingsUpdated({ showRecurringTaskPreviews: false }));
    flushSync();
    expect(target.querySelector('[role="note"]')).toBeNull();
    expect(store.getState().tracker).toBe(index);
    await unmount(component);
    target.remove();
  },
);
