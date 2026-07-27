import { flushSync, mount, unmount } from "svelte";
import { writable } from "svelte/store";
import { afterEach, describe, expect, test, vi } from "vitest";

import { obsidianContextKey } from "../src/constants";
import { defaultSettingsForTests } from "../src/settings";
import type { ObsidianContext } from "../src/types";
import RenderedMarkdown from "../src/ui/components/rendered-markdown.svelte";

import { baseTask } from "./edit/util/fixtures";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("RenderedMarkdown", () => {
  test("renders task markdown relative to its source file", () => {
    const target = document.createElement("div");
    const renderMarkdown = vi.fn(() => vi.fn());
    const sourcePath = "Journal/2026-07-27.md";
    const context = new Map<string, unknown>([
      [
        obsidianContextKey,
        {
          renderMarkdown,
          settings: writable(defaultSettingsForTests),
          toggleCheckboxInFile: vi.fn(),
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);

    const component = mount(RenderedMarkdown, {
      context,
      props: {
        task: {
          ...baseTask,
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
    const sourcePath = "Journal/2026-07-27.md";
    const settings = writable({
      ...defaultSettingsForTests,
      hideTasksMetadata: false,
    });
    const context = new Map<string, unknown>([
      [
        obsidianContextKey,
        {
          renderMarkdown,
          settings,
          toggleCheckboxInFile: vi.fn(),
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);

    const component = mount(RenderedMarkdown, {
      context,
      props: {
        task: {
          ...baseTask,
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
