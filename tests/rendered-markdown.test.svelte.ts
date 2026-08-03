import { flushSync, mount, unmount } from "svelte";
import { writable } from "svelte/store";
import { afterEach, describe, expect, test, vi } from "vitest";

import { obsidianContextKey } from "../src/constants";
import { defaultSettingsForTests } from "../src/settings";
import type { ObsidianContext } from "../src/types";
import RenderedMarkdown from "../src/ui/components/rendered-markdown.svelte";

import { baseTimeBlock } from "./edit/util/fixtures";

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
    { durationMinutes: 50, expectedStacked: false },
    { durationMinutes: 60, expectedStacked: true },
  ])(
    "keeps the header top-aligned when stacked=$expectedStacked at the 50-to-60-minute boundary",
    ({ durationMinutes, expectedStacked }) => {
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
            durationMinutes,
            text: `00:00 - ${durationMinutes === 50 ? "00:50" : "01:00"} ${"Very long title ".repeat(12)}`,
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
        `00:00 - ${durationMinutes === 50 ? "00:50" : "01:00"}`,
      );
      expect(
        summaryRow?.querySelector(".first-line-wrapper")?.textContent,
      ).toContain("Very long title ".repeat(12).trim());

      unmount(component);
    },
  );

  test.each([
    {
      durationMinutes: 40,
      hideTimeRangeInSingleLine: true,
      expectedVisible: false,
    },
    {
      durationMinutes: 50,
      hideTimeRangeInSingleLine: false,
      expectedVisible: true,
    },
    {
      durationMinutes: 50,
      hideTimeRangeInSingleLine: true,
      expectedVisible: false,
    },
    {
      durationMinutes: 58,
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
});
