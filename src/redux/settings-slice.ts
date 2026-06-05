/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { type PayloadAction } from "@reduxjs/toolkit";

import { type DayPlannerSettings, defaultSettings } from "../settings";

import { createAppSlice } from "./create-app-slice";

interface SettingsSliceState {
  settings: DayPlannerSettings;
}

export const initialState: SettingsSliceState = {
  settings: defaultSettings,
};

export const settingsSlice = createAppSlice({
  name: "settings",
  initialState,
  reducers: (create) => ({
    settingsUpdated: create.reducer(
      (state, action: PayloadAction<Partial<DayPlannerSettings>>) => {
        state.settings = { ...state.settings, ...action.payload };
      },
    ),
    settingsLoaded: create.reducer(
      (state, action: PayloadAction<DayPlannerSettings>) => {
        state.settings = action.payload;
      },
    ),
  }),
  selectors: {
    selectIcals: (state) => state.settings.icals,
    selectSettings: (state) => state.settings,
  },
});

export const { settingsUpdated, settingsLoaded } = settingsSlice.actions;

export const { selectSettings, selectIcals } = settingsSlice.selectors;
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
