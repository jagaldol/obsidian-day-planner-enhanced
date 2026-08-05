import { afterEach, describe, expect, test, vi } from "vitest";

import {
  createRenderMarkdownAttachment,
  createAutoScroll,
  dispatchAutoScrollPointerMove,
  getIsomorphicClientY,
  getPointerOffsetY,
  isInteractiveEventTarget,
  listenForAutoScrollPointerMove,
} from "../src/util/dom";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("pointer coordinates", () => {
  test("touch events use viewport client coordinates", () => {
    vi.stubGlobal("PointerEvent", MouseEvent);

    const event = {
      changedTouches: [],
      touches: [{ clientY: 140, pageY: 540 }],
    } as unknown as TouchEvent;
    const el = document.createElement("div");

    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      top: 100,
    } as DOMRect);

    expect(getIsomorphicClientY(event)).toBe(140);
    expect(getPointerOffsetY(el, event)).toBe(40);
  });
});

describe("interactive event targets", () => {
  test("recognizes links and their descendants", () => {
    const block = document.createElement("div");
    const link = document.createElement("a");
    const child = document.createElement("span");

    link.appendChild(child);
    block.appendChild(link);

    expect(isInteractiveEventTarget(link)).toBe(true);
    expect(isInteractiveEventTarget(child)).toBe(true);
    expect(isInteractiveEventTarget(document.createElement("div"))).toBe(false);
  });
});

describe("rendered markdown checkboxes", () => {
  test("persists a checkbox on the first file line from one semantic click", async () => {
    const outer = document.createElement("div");
    const markdownContainer = document.createElement("div");
    const onOuterPointerDown = vi.fn();
    const onOuterTouchStart = vi.fn();
    const toggleCheckbox = vi.fn(async () => {});
    const destroyMarkdown = vi.fn();
    const renderMarkdown = vi.fn((el: HTMLElement) => {
      el.innerHTML =
        '<ul><li data-task=""><input type="checkbox"> First task</li></ul>';

      return destroyMarkdown;
    });
    const attach = createRenderMarkdownAttachment({
      renderMarkdown,
      markdown: "- [ ] First task",
      sourcePath: "daily-note.md",
      taskLines: [0],
      onCheckboxLineClick: toggleCheckbox,
    });

    outer.addEventListener("pointerdown", onOuterPointerDown);
    outer.addEventListener("touchstart", onOuterTouchStart);
    outer.append(markdownContainer);
    const detach = attach(markdownContainer);
    const checkbox = markdownContainer.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );

    expect(checkbox?.dataset.line).toBe("0");

    await Promise.resolve();
    checkbox?.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    checkbox?.dispatchEvent(new Event("touchstart", { bubbles: true }));
    checkbox?.dispatchEvent(new Event("pointerup", { bubbles: true }));
    checkbox?.click();
    await Promise.resolve();

    expect(onOuterPointerDown).not.toHaveBeenCalled();
    expect(onOuterTouchStart).not.toHaveBeenCalled();
    expect(toggleCheckbox).toHaveBeenCalledOnce();
    expect(toggleCheckbox).toHaveBeenCalledWith(0);

    detach();
    checkbox?.click();

    expect(toggleCheckbox).toHaveBeenCalledOnce();
    expect(destroyMarkdown).toHaveBeenCalledOnce();
  });
});

describe("drag auto-scroll", () => {
  test("recomputes the pointer after each scroll frame", () => {
    const animationFrames: FrameRequestCallback[] = [];
    const scroller = document.createElement("div");
    const observedScrollTops: number[] = [];
    const onScrollFrame = vi.fn((currentScroller: HTMLElement) => {
      observedScrollTops.push(currentScroller.scrollTop);
    });

    scroller.scrollTop = 100;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      animationFrames.push(callback);

      return animationFrames.length;
    });

    const { startScroll, stopScroll } = createAutoScroll(onScrollFrame);

    startScroll({ direction: "down", el: scroller });
    animationFrames.shift()?.(0);

    expect(scroller.scrollTop).toBe(108);
    expect(onScrollFrame).toHaveBeenCalledWith(scroller, 8);
    expect(observedScrollTops).toEqual([108]);

    startScroll({ direction: "up", el: scroller });
    animationFrames.shift()?.(16);

    expect(scroller.scrollTop).toBe(100);
    expect(onScrollFrame).toHaveBeenLastCalledWith(scroller, -8);
    expect(observedScrollTops).toEqual([108, 100]);

    stopScroll();
    startScroll({ direction: "down", el: scroller });

    expect(animationFrames).toHaveLength(1);

    animationFrames.shift()?.(32);

    expect(scroller.scrollTop).toBe(108);

    stopScroll();
    animationFrames.shift()?.(48);
    expect(animationFrames).toHaveLength(0);
  });

  test("routes the update only through the timeline under the pointer", () => {
    const scroller = document.createElement("div");
    const firstTimeline = document.createElement("div");
    const secondTimeline = document.createElement("div");
    const hitTarget = document.createElement("div");
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    const originalElementFromPoint = document.elementFromPoint;
    const elementFromPoint = vi.fn(() => hitTarget);

    const firstSubscription = listenForAutoScrollPointerMove(
      firstTimeline,
      firstListener,
    );
    const secondSubscription = listenForAutoScrollPointerMove(
      secondTimeline,
      secondListener,
    );
    secondTimeline.appendChild(hitTarget);
    scroller.append(firstTimeline, secondTimeline);

    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: elementFromPoint,
    });

    try {
      dispatchAutoScrollPointerMove(
        scroller,
        {
          clientX: 50,
          clientY: 140,
        },
        8,
      );
    } finally {
      firstSubscription.destroy();
      secondSubscription.destroy();
      Object.defineProperty(document, "elementFromPoint", {
        configurable: true,
        value: originalElementFromPoint,
      });
    }

    expect(firstListener).not.toHaveBeenCalled();
    expect(secondListener).toHaveBeenCalledOnce();
    expect(elementFromPoint).toHaveBeenCalledWith(50, 140);
    expect(secondListener).toHaveBeenCalledWith({
      clientY: 140,
      scrollDeltaY: 8,
    });
  });
});
