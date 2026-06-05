/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { createSelector, type PayloadAction } from "@reduxjs/toolkit";

import { defaultDayFormat } from "../constants";

import { createAppSlice } from "./create-app-slice";

interface ObsidianSliceState {
  visibleDays: string[];
}

export const initialState: ObsidianSliceState = {
  visibleDays: [],
};

export const globalSlice = createAppSlice({
  name: "obsidian",
  initialState,
  reducers: (create) => ({
    visibleDaysUpdated: create.reducer(
      (state, action: PayloadAction<string[]>) => {
        state.visibleDays = action.payload;
      },
    ),
  }),
  selectors: {
    selectVisibleDays: (state) => state.visibleDays,
  },
});

export const { visibleDaysUpdated } = globalSlice.actions;

export const { selectVisibleDays } = globalSlice.selectors;

export const selectSortedDedupedVisibleDays = createSelector(
  selectVisibleDays,
  (days) => {
    return [...new Set(days)]
      .sort()
      .map((it) => window.moment(it, defaultDayFormat));
  },
);
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
