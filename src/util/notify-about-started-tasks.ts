/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { emDash } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type { TimeBlock, WithDuration } from "../time-block-types";

import { getMinutesSinceMidnight } from "./moment";
import { createTimestamp, getOneLineSummary } from "./time-block-utils";

export function notifyAboutStartedTasks(
  timeBlocks: WithDuration<TimeBlock>[],
  settings: DayPlannerSettings,
) {
  if (typeof Notification === "undefined" || timeBlocks.length === 0) {
    return;
  }

  const firstTimeBlock = timeBlocks[0];
  const summary = getOneLineSummary(firstTimeBlock);
  const sourceStartTime =
    firstTimeBlock.timelineSegment?.sourceStartTime ?? firstTimeBlock.startTime;
  const sourceDurationMinutes =
    firstTimeBlock.timelineSegment?.sourceDurationMinutes ??
    firstTimeBlock.durationMinutes;
  const timestamp = createTimestamp(
    getMinutesSinceMidnight(sourceStartTime),
    sourceDurationMinutes,
    settings.timestampFormat,
    emDash,
  );

  new Notification(`Task started: ${summary}
${timestamp}`);
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
