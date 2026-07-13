import { createRawSnippet, flushSync, mount, unmount } from "svelte";
import { writable } from "svelte/store";
import { afterEach, describe, expect, test, vi } from "vitest";

import { obsidianContextKey } from "../src/constants";
import type { ObsidianContext } from "../src/types";
import Scroller from "../src/ui/components/scroller.svelte";
import type { EditOperation } from "../src/ui/hooks/use-edit/types";
import { listenForAutoScrollPointerMove } from "../src/util/dom";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("Scroller drag auto-scroll", () => {
  test("routes a scroll frame from the stored pointer to its timeline", () => {
    vi.stubGlobal("PointerEvent", MouseEvent);

    const animationFrames: FrameRequestCallback[] = [];
    const target = document.createElement("div");
    const editOperation = writable({} as EditOperation);
    const children = createRawSnippet<[boolean]>(() => ({
      render: () => `
        <div class="timeline-target">
          <div class="hit-target"></div>
        </div>
      `,
    }));
    const context = new Map([
      [
        obsidianContextKey,
        {
          editContext: { editOperation },
        } as unknown as ObsidianContext,
      ],
    ]);

    document.body.appendChild(target);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      animationFrames.push(callback);

      return animationFrames.length;
    });

    const component = mount(Scroller, {
      context,
      props: { children },
      target,
    });

    flushSync();

    const scroller = target.querySelector<HTMLElement>(".scroller");
    const timeline = target.querySelector<HTMLElement>(".timeline-target");
    const hitTarget = target.querySelector<HTMLElement>(".hit-target");

    expect(scroller).not.toBeNull();
    expect(timeline).not.toBeNull();
    expect(hitTarget).not.toBeNull();

    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 100,
    });
    vi.spyOn(scroller as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0,
    } as DOMRect);
    scroller!.scrollTop = 100;

    const originalElementFromPoint = document.elementFromPoint;
    const elementFromPoint = vi.fn(() => hitTarget);

    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: elementFromPoint,
    });

    const onAutoScrollPointerMove = vi.fn();
    const subscription = listenForAutoScrollPointerMove(
      timeline as HTMLElement,
      onAutoScrollPointerMove,
    );

    try {
      hitTarget!.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          clientX: 50,
          clientY: 95,
        }),
      );

      expect(animationFrames).toHaveLength(1);

      animationFrames.shift()?.(0);

      expect(scroller!.scrollTop).toBe(108);
      expect(elementFromPoint).toHaveBeenCalledWith(50, 95);
      expect(onAutoScrollPointerMove).toHaveBeenCalledWith({
        clientY: 95,
        scrollDeltaY: 8,
      });
    } finally {
      subscription.destroy();
      unmount(component);
      flushSync();
      Object.defineProperty(document, "elementFromPoint", {
        configurable: true,
        value: originalElementFromPoint,
      });
    }

    animationFrames.shift()?.(16);
    expect(scroller!.scrollTop).toBe(108);
  });
});
