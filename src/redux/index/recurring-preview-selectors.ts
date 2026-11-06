import { lruMemoize } from "@reduxjs/toolkit";

import {
  getRecurringPreviewForDay,
  prepareRecurringSource,
  type RecurringPreview,
  type RecurringSource,
} from "../../util/recurring-preview";
import { isCompleted } from "../../util/time-block-utils";
import { createAppSelector } from "../create-app-selector";
import { selectSettings } from "../settings-slice";

import { planEntryToTimeBlock } from "./entry-to-time-block";
import {
  selectListItemEntriesById,
  selectPlanEntriesById,
  type ListItemEntry,
  type PlanEntry,
} from "./index-slice";

const emptyPreviews: RecurringPreview[] = [];

export function createRecurringPreviewSelector() {
  // Immutable index objects make unchanged source lines reusable after other files are edited.
  const prepared = new WeakMap<
    PlanEntry,
    { parent: ListItemEntry; source: RecurringSource | undefined }
  >();
  const selectSeries = createAppSelector(
    [
      (state) =>
        selectSettings(state).showRecurringTaskPreviews
          ? selectPlanEntriesById(state)
          : undefined,
      (state) =>
        selectSettings(state).showRecurringTaskPreviews
          ? selectListItemEntriesById(state)
          : undefined,
      (state) => selectSettings(state).hiddenTaskStatuses,
    ],
    (plans, parents, hiddenStatuses) => {
      const series = new Map<
        string,
        { sources: RecurringSource[]; actualDays: Set<string> }
      >();
      if (!plans || !parents) return series;
      for (const plan of Object.values(plans)) {
        const parent = parents[plan.parentId];
        if (
          !parent ||
          (!parent.text.includes("🔁") &&
            !/\b(?:repeat|recurrence)\s*::/i.test(parent.text))
        )
          continue;
        // Prefer the explicit scheduled date over a second entry from the daily-note heading.
        if (
          plan.source === "dailyNoteDate" &&
          parent.planEntryIds?.some(
            (id) => plans[id]?.source === "tasksPluginProp",
          )
        )
          continue;
        let cached = prepared.get(plan);
        if (!cached || cached.parent !== parent) {
          cached = {
            parent,
            source: prepareRecurringSource(
              planEntryToTimeBlock({ planEntry: plan, parentEntry: parent }),
            ),
          };
          prepared.set(plan, cached);
        }
        const source = cached.source;
        if (!source) continue;
        const group = series.get(source.seriesKey) ?? {
          sources: [],
          actualDays: new Set<string>(),
        };
        group.actualDays.add(source.block.startTime.format("YYYY-MM-DD"));
        const status = parent.task;
        if (
          !isCompleted(status) &&
          status !== "-" &&
          !hiddenStatuses.includes(status ?? "")
        ) {
          group.sources.push(source);
        }
        series.set(source.seriesKey, group);
      }
      for (const group of series.values()) {
        group.sources.sort(
          (a, b) => b.block.startTime.valueOf() - a.block.startTime.valueOf(),
        );
      }
      return series;
    },
  );

  return createAppSelector(
    [selectSeries, (_state, dayKey: string) => dayKey],
    (series, dayKey) => {
      if (!series.size) return emptyPreviews;
      const result: RecurringPreview[] = [];
      const matches = new Map<string, boolean>();
      for (const { sources, actualDays } of series.values()) {
        // Materializing a distant occurrence must not hide previews before it.
        const source = sources.find(
          (item) => item.block.startTime.format("YYYY-MM-DD") < dayKey,
        );
        if (!source) continue;
        for (const preview of getRecurringPreviewForDay(
          source,
          dayKey,
          matches,
        )) {
          if (!actualDays.has(preview.occurrenceDay)) result.push(preview);
        }
      }
      return result;
    },
    // Keep navigation bounded; pointer movement, zoom, clocks and unrelated settings are not inputs.
    {
      memoize: lruMemoize,
      memoizeOptions: { maxSize: 32 },
      argsMemoize: lruMemoize,
      argsMemoizeOptions: { maxSize: 32 },
    },
  );
}

export const selectRecurringPreviewsForDay = createRecurringPreviewSelector();
