import type { TimeInterval, WithPlacing } from "../time-block-types";
import { getMinutesSinceMidnight } from "../util/moment";
import type { RecurringPreview } from "../util/recurring-preview";

import type { HorizontalPlacing } from "./horizontal-placing";

/** Share display columns without adding previews to the editable task collection. */
export function layoutRecurringPreviews<T extends TimeInterval>(
  realBlocks: WithPlacing<T>[],
  previews: RecurringPreview[],
) {
  const previewPlacings = new Map<string, HorizontalPlacing>();
  const timedPreviews = previews.filter((preview) => !preview.isAllDay);
  if (!timedPreviews.length) return { realBlocks, previewPlacings };

  const intervals = [
    ...realBlocks.map((block, index) => ({ block, index, preview: false })),
    ...timedPreviews.map((block, index) => ({ block, index, preview: true })),
  ]
    .map((item) => ({
      ...item,
      start: getMinutesSinceMidnight(item.block.startTime),
      end:
        getMinutesSinceMidnight(item.block.startTime) +
        item.block.durationMinutes,
    }))
    .sort((a, b) => a.start - b.start);
  const placedBlocks = [...realBlocks];
  let group: typeof intervals = [];
  let groupEnd = -Infinity;

  function placeGroup() {
    // Preserve existing real-event layout in groups unaffected by previews.
    if (!group.some((item) => item.preview)) return;
    const columnEnds: number[] = [];
    const columns = group.map((item) => {
      let column = columnEnds.findIndex((end) => end <= item.start);
      if (column === -1) column = columnEnds.length;
      columnEnds[column] = item.end;
      return column;
    });
    group.forEach((item, index) => {
      const placing = {
        spanPercent: 100 / columnEnds.length,
        offsetPercent: (columns[index]! * 100) / columnEnds.length,
      };
      if (item.preview) previewPlacings.set(item.block.id, placing);
      else placedBlocks[item.index] = { ...realBlocks[item.index]!, placing };
    });
  }

  for (const item of intervals) {
    if (item.start >= groupEnd) {
      placeGroup();
      group = [];
      groupEnd = -Infinity;
    }
    group.push(item);
    groupEnd = Math.max(groupEnd, item.end);
  }
  placeGroup();
  return { realBlocks: placedBlocks, previewPlacings };
}
