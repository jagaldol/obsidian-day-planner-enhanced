import { flushSync, mount, unmount } from "svelte";
import { writable } from "svelte/store";
import { afterEach, describe, expect, test, vi } from "vitest";

import { obsidianContextKey } from "../src/constants";
import { defaultSettingsForTests } from "../src/settings";
import type { ObsidianContext } from "../src/types";
import RenderedMarkdown from "../src/ui/components/rendered-markdown.svelte";

import type { ListItemEntryWithChildren } from "../src/redux/index/index-slice";

import { baseTimeBlock } from "./edit/util/fixtures";

function createNestedListItem(
  id: string,
  text: string,
  line: number,
): ListItemEntryWithChildren {
  return {
    id,
    text,
    task: " ",
    symbol: "-",
    path: "path",
    position: {
      start: { line, col: 0, offset: 0 },
      end: { line, col: 0, offset: 0 },
    },
    logEntries: [],
    planEntries: [],
  };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("RenderedMarkdown", () => {
  test.each([
    { durationMinutes: 20, expectedCompact: true, zoomLevel: 1 },
    { durationMinutes: 30, expectedCompact: false, zoomLevel: 1 },
    { durationMinutes: 10, expectedCompact: true, zoomLevel: 2 },
    { durationMinutes: 20, expectedCompact: false, zoomLevel: 2 },
  ])(
    "renders compact=$expectedCompact for a $durationMinutes-minute block at zoom $zoomLevel",
    ({ durationMinutes, expectedCompact, zoomLevel }) => {
      const target = document.createElement("div");
      const context = new Map<string, unknown>([
        [
          obsidianContextKey,
          {
            renderMarkdown: vi.fn(() => vi.fn()),
            settingsStore: writable({
              ...defaultSettingsForTests,
              zoomLevel,
            }),
            toggleCheckboxInFile: vi.fn(),
          } as unknown as ObsidianContext,
        ],
      ]);

      document.body.appendChild(target);

      const component = mount(RenderedMarkdown, {
        context,
        props: {
          timeBlock: {
            ...baseTimeBlock,
            durationMinutes,
          },
        },
        target,
      });

      flushSync();

      expect(
        target
          .querySelector(".time-summary-row")
          ?.classList.contains("is-compact"),
      ).toBe(expectedCompact);

      unmount(component);
    },
  );

  test.each([
    { durationMinutes: 30, expectedStacked: false, zoomLevel: 1 },
    { durationMinutes: 40, expectedStacked: true, zoomLevel: 1 },
    { durationMinutes: 15, expectedStacked: false, zoomLevel: 2 },
    { durationMinutes: 20, expectedStacked: true, zoomLevel: 2 },
  ])(
    "keeps the header top-aligned when stacked=$expectedStacked for $durationMinutes minutes at zoom $zoomLevel",
    ({ durationMinutes, expectedStacked, zoomLevel }) => {
      const target = document.createElement("div");
      const renderMarkdown = vi.fn((element: HTMLElement, markdown: string) => {
        const paragraph = document.createElement("p");

        paragraph.textContent = markdown;
        element.append(paragraph);

        return vi.fn();
      });
      const context = new Map<string, unknown>([
        [
          obsidianContextKey,
          {
            renderMarkdown,
            settingsStore: writable({
              ...defaultSettingsForTests,
              zoomLevel,
            }),
            toggleCheckboxInFile: vi.fn(),
          } as unknown as ObsidianContext,
        ],
      ]);

      document.body.appendChild(target);

      const component = mount(RenderedMarkdown, {
        context,
        props: {
          timeBlock: {
            ...baseTimeBlock,
            durationMinutes,
            text: `00:00 - 00:${String(durationMinutes).padStart(2, "0")} ${"Very long title ".repeat(12)}`,
          },
        },
        target,
      });

      flushSync();

      const summaryRow = target.querySelector(".time-summary-row");
      expect(summaryRow?.classList.contains("is-stacked-header")).toBe(
        expectedStacked,
      );
      expect(summaryRow?.querySelector(".time-block-range")?.textContent).toBe(
        `00:00 - 00:${String(durationMinutes).padStart(2, "0")}`,
      );
      expect(
        summaryRow?.querySelector(".first-line-wrapper")?.textContent,
      ).toContain("Very long title ".repeat(12).trim());

      unmount(component);
    },
  );

  test.each([
    { durationMinutes: 60, expectedStacked: false, nestedItemCount: 1 },
    { durationMinutes: 70, expectedStacked: true, nestedItemCount: 1 },
    { durationMinutes: 80, expectedStacked: false, nestedItemCount: 2 },
    { durationMinutes: 90, expectedStacked: true, nestedItemCount: 2 },
  ])(
    "accounts for $nestedItemCount nested items before rendering stacked=$expectedStacked at $durationMinutes pixels",
    ({ durationMinutes, expectedStacked, nestedItemCount }) => {
      const target = document.createElement("div");
      const context = new Map<string, unknown>([
        [
          obsidianContextKey,
          {
            renderMarkdown: vi.fn(() => vi.fn()),
            settingsStore: writable({
              ...defaultSettingsForTests,
              zoomLevel: 1,
            }),
            toggleCheckboxInFile: vi.fn(),
          } as unknown as ObsidianContext,
        ],
      ]);

      document.body.appendChild(target);

      const component = mount(RenderedMarkdown, {
        context,
        props: {
          timeBlock: {
            ...baseTimeBlock,
            children: Array.from({ length: nestedItemCount }, (_, index) => ({
              children: [],
              id: `nested-item-${index + 1}`,
              logEntries: [],
              path: "path",
              planEntries: [],
              position: {
                end: { col: 0, line: index + 2, offset: 0 },
                start: { col: 0, line: index + 1, offset: 0 },
              },
              symbol: "-",
              text: `Nested item ${index + 1}`,
            })),
            durationMinutes,
          },
        },
        target,
      });

      flushSync();

      expect(
        target
          .querySelector(".time-summary-row")
          ?.classList.contains("is-stacked-header"),
      ).toBe(expectedStacked);

      unmount(component);
    },
  );

  test.each([
    {
      durationMinutes: 30,
      hideTimeRangeInSingleLine: true,
      expectedVisible: false,
    },
    {
      durationMinutes: 50,
      hideTimeRangeInSingleLine: false,
      expectedVisible: true,
    },
    {
      durationMinutes: 40,
      hideTimeRangeInSingleLine: true,
      expectedVisible: true,
    },
  ])(
    "renders the time range visible=$expectedVisible for a $durationMinutes-minute block when hideTimeRangeInSingleLine=$hideTimeRangeInSingleLine",
    ({ durationMinutes, hideTimeRangeInSingleLine, expectedVisible }) => {
      const target = document.createElement("div");
      const context = new Map<string, unknown>([
        [
          obsidianContextKey,
          {
            renderMarkdown: vi.fn(() => vi.fn()),
            settingsStore: writable({
              ...defaultSettingsForTests,
              hideTimeRangeInSingleLine,
            }),
            toggleCheckboxInFile: vi.fn(),
          } as unknown as ObsidianContext,
        ],
      ]);

      document.body.appendChild(target);

      const component = mount(RenderedMarkdown, {
        context,
        props: {
          timeBlock: {
            ...baseTimeBlock,
            durationMinutes,
          },
        },
        target,
      });

      flushSync();

      expect(target.querySelector(".time-block-range") !== null).toBe(
        expectedVisible,
      );

      unmount(component);
    },
  );

  test("renders time block markdown relative to its source file", () => {
    const target = document.createElement("div");
    const renderMarkdown = vi.fn(() => vi.fn());
    const sourcePath = "fixtures/daily/2023-01-01.md";
    const context = new Map<string, unknown>([
      [
        obsidianContextKey,
        {
          renderMarkdown,
          settingsStore: writable(defaultSettingsForTests),
          toggleCheckboxInFile: vi.fn(),
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);

    const component = mount(RenderedMarkdown, {
      context,
      props: {
        timeBlock: {
          ...baseTimeBlock,
          path: sourcePath,
          text: "10:00 - 11:00 Review [[Project]]",
        },
      },
      target,
    });

    flushSync();

    expect(renderMarkdown).toHaveBeenCalledOnce();
    expect(renderMarkdown).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.stringContaining("[[Project]]"),
      sourcePath,
    );

    unmount(component);
  });

  test("reactively hides Tasks metadata when the setting is enabled", () => {
    const target = document.createElement("div");
    const renderMarkdown = vi.fn(() => vi.fn());
    const sourcePath = "fixtures/daily/2023-01-01.md";
    const settings = writable({
      ...defaultSettingsForTests,
      hideTasksMetadata: false,
    });
    const context = new Map<string, unknown>([
      [
        obsidianContextKey,
        {
          renderMarkdown,
          settingsStore: settings,
          toggleCheckboxInFile: vi.fn(),
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);

    const component = mount(RenderedMarkdown, {
      context,
      props: {
        timeBlock: {
          ...baseTimeBlock,
          path: sourcePath,
          text: "10:00 - 11:00 Review proposal ⏳ 2026-07-27 📅 2026-08-07",
        },
      },
      target,
    });

    flushSync();

    expect(renderMarkdown).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.stringContaining("⏳ 2026-07-27"),
      sourcePath,
    );

    settings.update((current) => ({
      ...current,
      hideTasksMetadata: true,
    }));
    flushSync();

    expect(renderMarkdown).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      "- [ ] Review proposal",
      sourcePath,
    );

    unmount(component);
  });

  test("does not re-render markdown when an edit hands it an equal time block", () => {
    const target = document.createElement("div");
    const renderMarkdown = vi.fn(() => vi.fn());
    const context = new Map<string, unknown>([
      [
        obsidianContextKey,
        {
          renderMarkdown,
          settingsStore: writable(defaultSettingsForTests),
          toggleCheckboxInFile: vi.fn(),
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);

    const props = $state({
      timeBlock: {
        ...baseTimeBlock,
        text: "10:00 - 11:00 Review proposal",
        children: [
          createNestedListItem("child-1", "Read the brief", 1),
          createNestedListItem("child-2", "Leave a comment", 2),
        ],
      },
    });

    const component = mount(RenderedMarkdown, { context, props, target });

    flushSync();

    const callsAfterMount = renderMarkdown.mock.calls.length;

    expect(callsAfterMount).toBeGreaterThan(0);

    // An active edit operation rebuilds every block object on each pointer
    // move, so an unchanged block still arrives as a new reference.
    props.timeBlock = {
      ...baseTimeBlock,
      text: "10:00 - 11:00 Review proposal",
      children: [
        createNestedListItem("child-1", "Read the brief", 1),
        createNestedListItem("child-2", "Leave a comment", 2),
      ],
    };
    flushSync();

    expect(renderMarkdown).toHaveBeenCalledTimes(callsAfterMount);

    unmount(component);
  });

  test("re-renders markdown once the block text actually changes", () => {
    const target = document.createElement("div");
    const renderMarkdown = vi.fn(() => vi.fn());
    const context = new Map<string, unknown>([
      [
        obsidianContextKey,
        {
          renderMarkdown,
          settingsStore: writable(defaultSettingsForTests),
          toggleCheckboxInFile: vi.fn(),
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);

    const props = $state({
      timeBlock: { ...baseTimeBlock, text: "10:00 - 11:00 Review proposal" },
    });

    const component = mount(RenderedMarkdown, { context, props, target });

    flushSync();

    const callsAfterMount = renderMarkdown.mock.calls.length;

    props.timeBlock = { ...baseTimeBlock, text: "10:00 - 11:00 Ship release" };
    flushSync();

    expect(renderMarkdown.mock.calls.length).toBeGreaterThan(callsAfterMount);
    expect(renderMarkdown).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      "- [ ] Ship release",
      "path",
    );

    unmount(component);
  });
});
