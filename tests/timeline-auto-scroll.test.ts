import { get } from "svelte/store";
import { afterEach, describe, expect, test } from "vitest";

import {
  canAutoScrollToNow,
  setTimelineSelectionActive,
  timelineSelectionActive,
} from "../src/global-store/timeline-auto-scroll";

describe("timeline auto-scroll", () => {
  const tokens: symbol[] = [];

  function createSelectionToken() {
    const token = Symbol("test-selection");

    tokens.push(token);

    return token;
  }

  afterEach(() => {
    tokens.forEach((token) => setTimelineSelectionActive(token, false));
    tokens.length = 0;
  });

  test("auto-scroll only runs when enabled and not blocked by user activity or selection", () => {
    expect(
      canAutoScrollToNow({
        autoScrollBlocked: false,
        centerNeedle: true,
        selectionActive: false,
      }),
    ).toBe(true);

    expect(
      canAutoScrollToNow({
        autoScrollBlocked: true,
        centerNeedle: true,
        selectionActive: false,
      }),
    ).toBe(false);

    expect(
      canAutoScrollToNow({
        autoScrollBlocked: false,
        centerNeedle: false,
        selectionActive: false,
      }),
    ).toBe(false);

    expect(
      canAutoScrollToNow({
        autoScrollBlocked: false,
        centerNeedle: true,
        selectionActive: true,
      }),
    ).toBe(false);
  });

  test("selection remains active until every selected block is cleared", () => {
    const first = createSelectionToken();
    const second = createSelectionToken();

    expect(get(timelineSelectionActive)).toBe(false);

    setTimelineSelectionActive(first, true);
    setTimelineSelectionActive(second, true);

    expect(get(timelineSelectionActive)).toBe(true);

    setTimelineSelectionActive(first, false);

    expect(get(timelineSelectionActive)).toBe(true);

    setTimelineSelectionActive(second, false);

    expect(get(timelineSelectionActive)).toBe(false);
  });
});
