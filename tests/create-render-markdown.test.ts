import type { App } from "obsidian";
import { Component, Keymap, MarkdownRenderer } from "obsidian";
import { describe, expect, test, vi } from "vitest";

vi.mock("obsidian", () => ({
  Component: class Component {
    load() {}

    unload() {}
  },
  Keymap: {
    isModEvent: vi.fn((event: MouseEvent) =>
      event.metaKey || event.ctrlKey || event.button === 1 ? "tab" : false,
    ),
  },
  MarkdownRenderer: {
    render: vi.fn(() => Promise.resolve()),
  },
}));

import { createRenderMarkdown } from "../src/util/create-render-markdown";

describe("createRenderMarkdown", () => {
  test("renders links relative to the task source file", () => {
    const app = { workspace: {} } as App;
    const el = document.createElement("div");
    const sourcePath = "Journal/2026-07-27.md";

    createRenderMarkdown(app)(el, "[[Project]]", sourcePath);

    expect(MarkdownRenderer.render).toHaveBeenCalledWith(
      app,
      "[[Project]]",
      el,
      sourcePath,
      expect.any(Component),
    );
  });

  test("opens internal links from the rendered timeline markdown", () => {
    const openLinkText = vi.fn(() => Promise.resolve());
    const app = { workspace: { openLinkText } } as unknown as App;
    const el = document.createElement("div");
    const link = document.createElement("a");
    const linkText = document.createElement("span");
    const sourcePath = "Journal/2026-07-27.md";

    const destroy = createRenderMarkdown(app)(el, "[[Project]]", sourcePath);

    link.className = "internal-link";
    link.dataset.href = "../Projects/Day Planner";
    link.appendChild(linkText);
    el.appendChild(link);

    const event = new MouseEvent("click", {
      bubbles: true,
      button: 0,
      cancelable: true,
    });

    linkText.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(Keymap.isModEvent).toHaveBeenCalledWith(event);
    expect(openLinkText).toHaveBeenCalledWith(
      "../Projects/Day Planner",
      sourcePath,
      false,
    );

    destroy();
  });

  test("preserves Obsidian's modifier behavior and removes listeners", () => {
    const openLinkText = vi.fn(() => Promise.resolve());
    const app = { workspace: { openLinkText } } as unknown as App;
    const el = document.createElement("div");
    const link = document.createElement("a");

    const destroy = createRenderMarkdown(app)(
      el,
      "[[Project]]",
      "Journal/2026-07-27.md",
    );

    link.className = "internal-link";
    link.dataset.href = "Project";
    el.appendChild(link);

    link.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        metaKey: true,
      }),
    );

    expect(openLinkText).toHaveBeenCalledWith(
      "Project",
      "Journal/2026-07-27.md",
      "tab",
    );

    destroy();
    link.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(openLinkText).toHaveBeenCalledOnce();
  });
});
