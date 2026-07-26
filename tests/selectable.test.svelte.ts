import { createRawSnippet, flushSync, mount, unmount } from "svelte";
import { get } from "svelte/store";
import { describe, expect, test, vi } from "vitest";

import { timelineSelectionActive } from "../src/global-store/timeline-auto-scroll";
import type { HTMLActionArray } from "../src/ui/actions/use-actions";
import Selectable from "../src/ui/components/selectable.svelte";

interface SelectableChildrenProps {
  use: HTMLActionArray;
  state: "primary" | "secondary" | "none";
  onpointerup: (event: PointerEvent) => void;
}

function renderSelectable() {
  const target = document.createElement("div");
  const children = createRawSnippet<[SelectableChildrenProps]>(
    (getChildrenProps) => ({
      render: () => `
        <div class="selectable-test-block">
          <a class="internal-link" href="#">Linked note</a>
          <span class="block-text">Block text</span>
        </div>
      `,
      setup: (element) => {
        const handlePointerUp = (event: Event) => {
          getChildrenProps().onpointerup(event as PointerEvent);
        };

        element.addEventListener("pointerup", handlePointerUp);

        return () => element.removeEventListener("pointerup", handlePointerUp);
      },
    }),
  );

  document.body.appendChild(target);

  const component = mount(Selectable, {
    props: { children },
    target,
  });

  flushSync();

  return { component, target };
}

function dispatchPointerUp(element: Element) {
  element.dispatchEvent(
    new MouseEvent("pointerup", {
      bubbles: true,
      button: 0,
    }),
  );
  flushSync();
}

describe("Selectable", () => {
  test("does not select the block when a rendered link is clicked", () => {
    const { component, target } = renderSelectable();

    try {
      const link = target.querySelector(".internal-link");
      const onClick = vi.fn();

      expect(link).not.toBeNull();
      expect(get(timelineSelectionActive)).toBe(false);

      link?.addEventListener("click", onClick);
      dispatchPointerUp(link as Element);
      link?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );

      expect(get(timelineSelectionActive)).toBe(false);
      expect(onClick).toHaveBeenCalledOnce();
    } finally {
      unmount(component);
      target.remove();
      flushSync();
    }
  });

  test("keeps selecting the block from non-interactive content", () => {
    const { component, target } = renderSelectable();

    try {
      const blockText = target.querySelector(".block-text");

      expect(blockText).not.toBeNull();
      expect(get(timelineSelectionActive)).toBe(false);

      dispatchPointerUp(blockText as Element);

      expect(get(timelineSelectionActive)).toBe(true);
    } finally {
      unmount(component);
      target.remove();
      flushSync();
    }
  });
});
