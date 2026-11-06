import { expect, test } from "vitest";

import { layoutRecurringPreviews } from "../src/overlap/recurring-preview-layout";
import type { RecurringPreview } from "../src/util/recurring-preview";

function real(id: string, start: string, durationMinutes: number) {
  return {
    id,
    startTime: window.moment(`2026-11-07 ${start}`),
    durationMinutes,
    placing: { spanPercent: 100, offsetPercent: 0 },
  };
}
function preview(id: string, start: string, duration: number) {
  return {
    ...real(id, start, duration),
    isAllDay: false,
  } as unknown as RecurringPreview;
}

test("shares space between a real event and a recurring preview without mutating either", () => {
  const event = real("event", "18:50", 30);
  const ghost = preview("preview", "18:30", 60);
  const result = layoutRecurringPreviews([event], [ghost]);
  expect(result.previewPlacings.get("preview")).toEqual({
    spanPercent: 50,
    offsetPercent: 0,
  });
  expect(result.realBlocks[0]?.placing).toEqual({
    spanPercent: 50,
    offsetPercent: 50,
  });
  expect(event.placing.spanPercent).toBe(100);
  expect(result.realBlocks[0]?.startTime).toBe(event.startTime);
  expect(result.realBlocks.map((item) => item.id)).toEqual(["event"]);
});

test("allocates three columns to two previews and a real event", () => {
  const result = layoutRecurringPreviews(
    [real("real", "15:00", 120)],
    [preview("a", "15:00", 60), preview("b", "15:30", 60)],
  );
  expect(result.realBlocks[0]?.placing.spanPercent).toBeCloseTo(100 / 3);
  expect(result.previewPlacings.get("a")?.offsetPercent).toBeCloseTo(100 / 3);
  expect(result.previewPlacings.get("b")?.offsetPercent).toBeCloseTo(200 / 3);
});

test("reuses columns for a chain of partially overlapping intervals", () => {
  const result = layoutRecurringPreviews(
    [real("first", "15:00", 60), real("last", "16:00", 60)],
    [preview("middle", "15:30", 60)],
  );
  expect(result.realBlocks.map((item) => item.placing)).toEqual([
    { spanPercent: 50, offsetPercent: 0 },
    { spanPercent: 50, offsetPercent: 0 },
  ]);
  expect(result.previewPlacings.get("middle")).toEqual({
    spanPercent: 50,
    offsetPercent: 50,
  });
});

test("keeps touching intervals and unrelated real layouts unchanged", () => {
  const event = real("event", "16:00", 60);
  const result = layoutRecurringPreviews(
    [event],
    [preview("preview", "15:00", 60)],
  );
  expect(result.realBlocks[0]).toBe(event);
  expect(result.previewPlacings.get("preview")?.spanPercent).toBe(100);
});

test("returns the original layout when disabled or only all-day previews exist", () => {
  const blocks = [real("real", "15:00", 60)];
  expect(layoutRecurringPreviews(blocks, []).realBlocks).toBe(blocks);
  const result = layoutRecurringPreviews(blocks, [
    { ...preview("all-day", "00:00", 1440), isAllDay: true },
  ]);
  expect(result.realBlocks).toBe(blocks);
  expect(result.previewPlacings.size).toBe(0);
});

test("responds to dragging a real event out of the overlap", () => {
  const ghost = preview("preview", "15:00", 60);
  expect(
    layoutRecurringPreviews([real("real", "15:00", 60)], [ghost]).realBlocks[0]
      ?.placing.spanPercent,
  ).toBe(50);
  expect(
    layoutRecurringPreviews([real("real", "16:00", 60)], [ghost]).realBlocks[0]
      ?.placing.spanPercent,
  ).toBe(100);
});

test("places a thousand overlapping previews in distinct bounded columns", () => {
  const previews = Array.from({ length: 1000 }, (_, index) =>
    preview(String(index), "15:00", 60),
  );
  const start = performance.now();
  const result = layoutRecurringPreviews([], previews);
  console.info(
    `Preview overlap layout (1000 concurrent): ${(performance.now() - start).toFixed(1)}ms`,
  );
  expect(result.previewPlacings.size).toBe(1000);
  expect(
    new Set(
      [...result.previewPlacings.values()].map((item) => item.offsetPercent),
    ).size,
  ).toBe(1000);
  for (const placing of result.previewPlacings.values()) {
    expect(placing.spanPercent).toBeCloseTo(0.1);
    expect(placing.offsetPercent + placing.spanPercent).toBeLessThanOrEqual(
      100,
    );
  }
});
