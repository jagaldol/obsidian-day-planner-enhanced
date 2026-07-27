import type { App, HoverParent } from "obsidian";
import { describe, expect, test, vi } from "vitest";

import { createShowPreview } from "../src/util/create-show-preview";

describe("createShowPreview", () => {
  test("keeps the hover parent separate from the hovered target", () => {
    const trigger = vi.fn();
    const app = {
      internalPlugins: {
        plugins: {
          "page-preview": { enabled: true },
        },
      },
      workspace: { trigger },
    } as unknown as App;
    const hoverParent: HoverParent = { hoverPopover: null };
    const targetEl = document.createElement("span");
    const event = new MouseEvent("mouseover");

    createShowPreview(app)(
      hoverParent,
      targetEl,
      event,
      "../Projects/Day Planner",
      12,
      "fixtures/daily/2023-01-01.md",
    );

    expect(trigger).toHaveBeenCalledWith("hover-link", {
      event,
      source: "search",
      hoverParent,
      targetEl,
      linktext: "../Projects/Day Planner",
      sourcePath: "fixtures/daily/2023-01-01.md",
      state: { scroll: 12 },
    });
  });

  test("uses a modifier-free source when requested", () => {
    const trigger = vi.fn();
    const app = {
      internalPlugins: {
        plugins: {
          "page-preview": { enabled: true },
        },
      },
      workspace: { trigger },
    } as unknown as App;
    const hoverParent: HoverParent = { hoverPopover: null };
    const targetEl = document.createElement("a");
    const event = new MouseEvent("mouseover");

    createShowPreview(app, {
      source: "preview",
    })(hoverParent, targetEl, event, "Project");

    expect(trigger).toHaveBeenCalledWith("hover-link", {
      event,
      source: "preview",
      hoverParent,
      targetEl,
      linktext: "Project",
      sourcePath: "Project",
    });
  });
});
