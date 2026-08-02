import { describe, expect, test, vi } from "vitest";

import {
  createHoverPreview,
  createInternalLinkHoverPreview,
} from "../src/ui/actions/hover-preview";
import type { LocalTimeBlock } from "../src/time-block-types";

import { baseTimeBlock, unscheduledTimeBlock } from "./edit/util/fixtures";

function setUp(timeBlock: LocalTimeBlock = baseTimeBlock) {
  const showPreview = vi.fn();
  const block = document.createElement("div");
  const link = document.createElement("a");
  const linkText = document.createElement("span");
  const blockText = document.createElement("span");
  const timeRange = document.createElement("div");
  const timeText = document.createElement("span");

  link.className = "internal-link";
  link.dataset.href = "Linked note";
  link.appendChild(linkText);
  timeRange.className = "time-block-range";
  timeRange.appendChild(timeText);
  block.append(timeRange, link, blockText);
  document.body.appendChild(block);

  const action = createHoverPreview(timeBlock, { showPreview })(block);

  return {
    action,
    block,
    blockText,
    linkText,
    showPreview,
    timeRange,
    timeText,
  };
}

describe("hoverPreview", () => {
  test("requests the rendered link preview from Obsidian", () => {
    const { action, block, linkText, showPreview } = setUp();
    const event = new MouseEvent("mouseover", { bubbles: true });

    try {
      linkText.dispatchEvent(event);

      expect(showPreview).toHaveBeenCalledWith(
        expect.objectContaining({ hoverPopover: null }),
        linkText.parentElement,
        expect.any(MouseEvent),
        "Linked note",
        undefined,
        "path",
      );
      expect(showPreview.mock.calls[0]?.[2]).not.toBe(event);
    } finally {
      action.destroy();
      block.remove();
    }
  });

  test("does not forcibly unload the source popover on link entry", () => {
    const { action, block, linkText, showPreview, timeRange, timeText } =
      setUp();
    const unload = vi.fn();

    try {
      timeText.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      Object.assign(timeRange, { hoverPopover: { unload } });

      linkText.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

      expect(showPreview).toHaveBeenCalledTimes(2);
      expect(unload).not.toHaveBeenCalled();
      expect(Reflect.get(timeRange, "hoverPopover")).toEqual({
        unload,
      });

      timeText.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

      expect(showPreview).toHaveBeenCalledTimes(3);
    } finally {
      action.destroy();
      block.remove();
    }
  });

  test("previews a timeline source location without a modifier key", () => {
    const { action, block, showPreview, timeRange, timeText } = setUp();
    const event = new MouseEvent("mouseover", { bubbles: true });

    try {
      timeText.dispatchEvent(event);

      expect(showPreview).toHaveBeenCalledWith(
        expect.objectContaining({ hoverPopover: null }),
        timeRange,
        event,
        "path",
        0,
        "path",
      );
    } finally {
      action.destroy();
      block.remove();
    }
  });

  test("does not preview an all-day source location", () => {
    const { action, block, blockText, showPreview, timeText } =
      setUp(unscheduledTimeBlock);
    const event = new MouseEvent("mouseover", { bubbles: true });

    try {
      blockText.dispatchEvent(event);
      timeText.dispatchEvent(event);

      expect(showPreview).not.toHaveBeenCalled();
    } finally {
      action.destroy();
      block.remove();
    }
  });

  test("previews an all-day wikilink without a modifier key", () => {
    const { action, block, linkText, showPreview } =
      setUp(unscheduledTimeBlock);
    const event = new MouseEvent("mouseover", { bubbles: true });
    const renderedLinkHover = vi.fn();
    linkText.parentElement?.addEventListener("mouseover", renderedLinkHover);

    try {
      linkText.dispatchEvent(event);

      expect(showPreview).toHaveBeenCalledWith(
        expect.objectContaining({ hoverPopover: null }),
        linkText.parentElement,
        expect.any(MouseEvent),
        "Linked note",
        undefined,
        "path",
      );
      expect(showPreview.mock.calls[0]?.[2]).not.toBe(event);

      linkText.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

      expect(showPreview).toHaveBeenCalledTimes(2);
      expect(showPreview.mock.calls[0]?.[0]).toBe(
        showPreview.mock.calls[1]?.[0],
      );
      expect(renderedLinkHover).not.toHaveBeenCalled();
    } finally {
      action.destroy();
      block.remove();
    }
  });

  test("does not preview non-time timeline content", () => {
    const { action, block, blockText, showPreview } = setUp();

    try {
      blockText.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      block.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

      expect(showPreview).not.toHaveBeenCalled();
    } finally {
      action.destroy();
      block.remove();
    }
  });
});

describe("internalLinkHoverPreview", () => {
  test("previews the rendered link without a modifier key", () => {
    const showPreview = vi.fn();
    const container = document.createElement("div");
    const plainText = document.createElement("span");
    const link = document.createElement("a");
    const linkText = document.createElement("span");

    link.className = "internal-link";
    link.dataset.href = "Project#Plan";
    link.appendChild(linkText);
    container.append(plainText, link);
    document.body.appendChild(container);

    const action = createInternalLinkHoverPreview(
      "fixtures/daily/2023-01-01.md",
      {
        showPreview,
      },
    )(container);
    const event = new MouseEvent("mouseover", { bubbles: true });

    try {
      plainText.dispatchEvent(event);
      expect(showPreview).not.toHaveBeenCalled();

      linkText.dispatchEvent(event);
      expect(showPreview).toHaveBeenCalledWith(
        expect.objectContaining({ hoverPopover: null }),
        link,
        expect.any(MouseEvent),
        "Project#Plan",
        undefined,
        "fixtures/daily/2023-01-01.md",
      );
      expect(showPreview.mock.calls[0]?.[2]).not.toBe(event);
    } finally {
      action.destroy();
      container.remove();
    }
  });
});
