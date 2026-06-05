/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { pipe } from "effect";
import { filter, map } from "lodash/fp";

import { addHorizontalPlacing } from "../../overlap/overlap";
import type { Task, WithTime } from "../../task-types";
import type { Signal } from "../../types";
import { doesOverlapWithRange } from "../../util/moment";
import type { Moment } from "../../util/obsidian-moment";
import * as t from "../../util/task-utils";

export class MiniTimeline {
  private readonly hours = 3;

  readonly blocksPerHour = 6;
  readonly totalBlocks = this.blocksPerHour * this.hours;
  readonly timeMarkerWidthPx = 8;
  readonly timeMarkerHalfWidthPx = this.timeMarkerWidthPx / 2;

  constructor(
    private readonly currentTimeSignal: Signal<Moment>,
    private readonly tasksWithTimeForToday: Signal<Array<WithTime<Task>>>,
  ) {}

  timeMarkerOffsetPx = $derived(
    this.currentTimeSignal.current.minutes() - this.timeMarkerHalfWidthPx,
  );

  private rangeStart = $derived(
    this.currentTimeSignal.current.clone().startOf("hour"),
  );

  private rangeEnd = $derived(
    this.currentTimeSignal.current
      .clone()
      .add(this.hours, "hours")
      .endOf("hour"),
  );

  displayedBlocks = $derived(
    pipe(
      this.tasksWithTimeForToday.current,
      filter((it) =>
        doesOverlapWithRange(
          { start: it.startTime, end: t.getEndTime(it) },
          {
            start: this.rangeStart,
            end: this.rangeEnd,
          },
        ),
      ),
      map((it) => ({
        ...t.clamp(it, this.rangeStart, this.rangeEnd),
        leftPx: it.startTime.clone().diff(this.rangeStart, `minutes`),
      })),
      addHorizontalPlacing,
    ),
  );
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
