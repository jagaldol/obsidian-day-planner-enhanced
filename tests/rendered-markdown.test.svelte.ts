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
});
