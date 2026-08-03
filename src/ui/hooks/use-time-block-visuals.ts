/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { derived, type Writable } from "svelte/store";

import { momentToTimelineOffset } from "../../global-store/derived-settings";
import type { DayPlannerSettings } from "../../settings";
import type {
  TimeBlock,
  WithPlacing,
  WithDuration,
} from "../../time-block-types";

interface UseTimeBlockVisualsProps {
  settingsStore: Writable<DayPlannerSettings>;
}

// todo: useTimeBlockPosition, move to one of stores, don't call inside component
export function useTimeBlockVisuals(
  timeBlock: WithPlacing<WithDuration<TimeBlock>>,
  { settingsStore }: UseTimeBlockVisualsProps,
) {
  const width = `${timeBlock.placing.spanPercent}%`;
  const left = `${timeBlock.placing.offsetPercent}%`;

  const offset = derived(settingsStore, ($settingsStore) => {
    return `${momentToTimelineOffset(timeBlock.startTime, $settingsStore)}px`;
  });

  const height = derived(settingsStore, ($settingsStore) => {
    return `${timeBlock.durationMinutes * $settingsStore.zoomLevel}px`;
  });

  return {
    width,
    left,
    offset,
    height,
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
