import type { App } from "obsidian";
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
    const hoverParent = document.createElement("div");
    const targetEl = document.createElement("span");
    const event = new MouseEvent("mouseover");

    createShowPreview(app)(
      hoverParent,
      targetEl,
      event,
      "../Projects/Day Planner",
      12,
      "Journal/2026-07-27.md",
    );

    expect(trigger).toHaveBeenCalledWith("hover-link", {
      event,
      source: "search",
      hoverParent,
      targetEl,
      linktext: "../Projects/Day Planner",
      sourcePath: "Journal/2026-07-27.md",
      state: { scroll: 12 },
    });
  });
});
