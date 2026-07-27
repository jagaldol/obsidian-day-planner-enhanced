import { writable } from "svelte/store";
import { describe, expect, test, vi } from "vitest";

import {
  createHoverPreview,
  createInternalLinkHoverPreview,
} from "../src/ui/actions/hover-preview";

import { baseTask } from "./edit/util/fixtures";

function setUp(isModPressedInitially: boolean) {
  const isModPressed = writable(isModPressedInitially);
  const showPreview = vi.fn();
  const block = document.createElement("div");
  const link = document.createElement("a");
  const linkText = document.createElement("span");
  const blockText = document.createElement("span");

  link.className = "internal-link";
  link.dataset.href = "Linked note";
  link.appendChild(linkText);
  block.append(link, blockText);
  document.body.appendChild(block);

  const action = createHoverPreview(baseTask, {
    isModPressed,
    showPreview,
  })(block);

  return {
    action,
    block,
    blockText,
    isModPressed,
    linkText,
    showPreview,
  };
}

describe("hoverPreview", () => {
  test("requests the rendered link preview from Obsidian", () => {
    const { action, block, linkText, showPreview } = setUp(true);
    const event = new MouseEvent("mouseover", { bubbles: true });

    try {
      linkText.dispatchEvent(event);

      expect(showPreview).toHaveBeenCalledWith(
        linkText.parentElement,
        linkText.parentElement,
        event,
        "Linked note",
        undefined,
        "path",
      );
    } finally {
      action.destroy();
      block.remove();
    }
  });

  test("does not forcibly unload the source popover on link entry", () => {
    const { action, block, blockText, linkText, showPreview } = setUp(true);
    const unload = vi.fn();

    try {
      blockText.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      Object.assign(blockText, { hoverPopover: { unload } });

      linkText.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

      expect(showPreview).toHaveBeenCalledTimes(2);
      expect(unload).not.toHaveBeenCalled();
      expect(Reflect.get(blockText, "hoverPopover")).toEqual({ unload });

      blockText.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

      expect(showPreview).toHaveBeenCalledTimes(3);
    } finally {
      action.destroy();
      block.remove();
    }
  });

  test("keeps source-location preview on non-interactive block content", () => {
    const { action, block, blockText, showPreview } = setUp(true);
    const event = new MouseEvent("mouseover", { bubbles: true });

    try {
      blockText.dispatchEvent(event);

      expect(showPreview).toHaveBeenCalledWith(
        blockText,
        blockText,
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

  test("uses the current non-interactive target when Mod is pressed later", () => {
    const { action, block, blockText, isModPressed, showPreview } =
      setUp(false);

    try {
      blockText.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

      expect(showPreview).not.toHaveBeenCalled();

      isModPressed.set(true);

      expect(showPreview).toHaveBeenCalledOnce();
      expect(showPreview.mock.calls[0]?.[1]).toBe(blockText);
    } finally {
      action.destroy();
      block.remove();
    }
  });

  test("does not start a source preview from a broad link container", () => {
    const { action, block, showPreview } = setUp(true);

    try {
      block.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

      expect(showPreview).not.toHaveBeenCalled();
    } finally {
      action.destroy();
      block.remove();
    }
  });
});

describe("internalLinkHoverPreview", () => {
  test("previews only the rendered link relative to its source file", () => {
    const isModPressed = writable(true);
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

    const action = createInternalLinkHoverPreview("Journal/2026-07-27.md", {
      isModPressed,
      showPreview,
    })(container);
    const event = new MouseEvent("mouseover", { bubbles: true });

    try {
      plainText.dispatchEvent(event);
      expect(showPreview).not.toHaveBeenCalled();

      linkText.dispatchEvent(event);
      expect(showPreview).toHaveBeenCalledWith(
        link,
        link,
        event,
        "Project#Plan",
        undefined,
        "Journal/2026-07-27.md",
      );
    } finally {
      action.destroy();
      container.remove();
    }
  });
});
