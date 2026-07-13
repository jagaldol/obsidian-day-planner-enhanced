import { afterEach, describe, expect, test, vi } from "vitest";

import {
  createAutoScroll,
  dispatchAutoScrollPointerMove,
  getIsomorphicClientY,
  getPointerOffsetY,
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
