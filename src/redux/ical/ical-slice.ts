/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import {
  createAction,
  createSelector,
  type PayloadAction,
} from "@reduxjs/toolkit";
import ical from "node-ical";

import type { IcalConfig } from "../../settings";
import type { RemoteTask } from "../../task-types";
import type { WithIcalConfig } from "../../types";
import { createAppSlice } from "../create-app-slice";

export type RawIcal = { icalConfig: IcalConfig; text: string };
export type SerializedRemoteTask = Omit<RemoteTask, "startTime"> & {
  startTime: string;
};

export interface IcalState {
  icalEvents: Array<WithIcalConfig<ical.VEvent>>;
  plainTextIcals: Array<RawIcal>;
  serializedRemoteTasks: Array<SerializedRemoteTask>;
}

export function isVEvent(event: ical.CalendarComponent): event is ical.VEvent {
  return event.type === "VEVENT";
}

export const initialIcalState: IcalState = {
  icalEvents: [],
  plainTextIcals: [],
  serializedRemoteTasks: [],
};

export const icalSlice = createAppSlice({
  name: "ical",
  initialState: initialIcalState,
  reducers: (create) => ({
    icalsFetched: create.reducer(
      (state, action: PayloadAction<Array<RawIcal>>) => {
        state.plainTextIcals = action.payload;
      },
    ),
    remoteTasksUpdated: create.reducer(
      (state, action: PayloadAction<Array<SerializedRemoteTask>>) => {
        state.serializedRemoteTasks = action.payload;
      },
    ),
  }),
  selectors: {
    selectSerializedRemoteTasks: (state) => state.serializedRemoteTasks,
    selectPlainTextIcals: (state) => state.plainTextIcals,
  },
});

export const icalRefreshRequested = createAction("ical/icalRefreshRequested");

export const { remoteTasksUpdated, icalsFetched } = icalSlice.actions;
export const { selectPlainTextIcals } = icalSlice.selectors;
const { selectSerializedRemoteTasks } = icalSlice.selectors;

export const selectAllIcalEventsWithIcalConfigs = createSelector(
  selectPlainTextIcals,
  (rawIcals) =>
    rawIcals.flatMap(
      ({ icalConfig, text }): Array<WithIcalConfig<ical.VEvent>> => {
        const parsed = ical.parseICS(text);

        return Object.values(parsed)
          .filter(isVEvent)
          .map((icalEvent) => ({
            ...icalEvent,
            calendar: icalConfig,
          }));
      },
    ),
);

export const selectRemoteTasks = createSelector(
  selectSerializedRemoteTasks,
  (serializedRemoteTasks) =>
    serializedRemoteTasks.map((it) => ({
      ...it,
      startTime: window.moment(it.startTime),
    })),
);
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
