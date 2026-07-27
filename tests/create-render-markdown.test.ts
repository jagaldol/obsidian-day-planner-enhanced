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
    const sourcePath = "fixtures/daily/2023-01-01.md";

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
    const sourcePath = "fixtures/daily/2023-01-01.md";

    const destroy = createRenderMarkdown(app)(el, "[[Project]]", sourcePath);

    link.className = "internal-link";
    link.dataset.href = "../Projects/Day Planner";
    link.appendChild(linkText);
    el.appendChild(link);
    const renderedLinkClick = vi.fn((event: MouseEvent) =>
      event.stopPropagation(),
    );
    link.addEventListener("click", renderedLinkClick);

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
    expect(renderedLinkClick).not.toHaveBeenCalled();

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
      "fixtures/daily/2023-01-01.md",
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
      "fixtures/daily/2023-01-01.md",
      "tab",
    );

    destroy();
    link.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(openLinkText).toHaveBeenCalledOnce();
  });
});
