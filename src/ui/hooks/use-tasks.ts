/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { derived, type Readable, type Writable } from "svelte/store";

import type { PeriodicNotes } from "../../service/periodic-notes";
import { WorkspaceFacade } from "../../service/workspace-facade";
import type { DayPlannerSettings } from "../../settings";
import type {
  EditableTimeBlock,
  RemoteTimeBlock,
  TimeBlock,
  WithDuration,
} from "../../time-block-types";
import type { OnEditAbortedFn, OnUpdateFn, PointerDateTime } from "../../types";
import type { Moment } from "../../util/obsidian-moment";
import { getUpdateTrigger } from "../../util/store";
import {
  getEndTime,
  hideNestedLocalPlanTimeBlocks,
  isWithDuration,
} from "../../util/time-block-utils";

import { useEditContext } from "./use-edit/use-edit-context";
import { useNewlyStartedTasks } from "./use-newly-started-tasks";

export function useTasks(props: {
  settingsStore: Writable<DayPlannerSettings>;
  isOnline: Readable<boolean>;
  currentTime: Readable<Moment>;
  workspaceFacade: WorkspaceFacade;
  onUpdate: OnUpdateFn;
  onEditAborted: OnEditAbortedFn;
  pointerDateTime: Readable<PointerDateTime>;
  remoteTasks: Readable<RemoteTimeBlock[]>;
  periodicNotes: PeriodicNotes;
  localTasks: Readable<EditableTimeBlock[]>;
}) {
  const {
    settingsStore,
    periodicNotes,
    currentTime,
    workspaceFacade,
    pointerDateTime,
    onUpdate,
    onEditAborted,
    remoteTasks: remoteTimeBlocks,
    localTasks: localTimeBlocks,
  } = props;

  const tasksWithTimeForToday = derived(
    [localTimeBlocks, remoteTimeBlocks, currentTime],
    ([$localTimeBlocks, $remoteTimeBlocks, $currentTime]: [
      TimeBlock[],
      TimeBlock[],
      Moment,
    ]) => {
      const startOfToday = $currentTime.clone().startOf("day");
      const endOfToday = startOfToday.clone().add(1, "day");

      return hideNestedLocalPlanTimeBlocks(
        $localTimeBlocks.concat($remoteTimeBlocks),
      ).filter(
        (timeBlock): timeBlock is WithDuration<TimeBlock> =>
          isWithDuration(timeBlock) &&
          !timeBlock.isAllDayEvent &&
          timeBlock.startTime.isBefore(endOfToday) &&
          getEndTime(timeBlock).isAfter(startOfToday),
      );
    },
  );

  const abortEditTrigger = derived(localTimeBlocks, getUpdateTrigger);

  const editContext = useEditContext({
    periodicNotes,
    workspaceFacade,
    onUpdate,
    onEditAborted,
    settings: settingsStore,
    localTasks: localTimeBlocks,
    remoteTasks: remoteTimeBlocks,
    pointerDateTime,
    abortEditTrigger,
  });

  const newlyStartedTasks = useNewlyStartedTasks({
    settings: settingsStore,
    tasksWithTimeForToday,
    currentTime,
  });

  return {
    tasksWithTimeForToday,
    editContext,
    newlyStartedTasks,
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
