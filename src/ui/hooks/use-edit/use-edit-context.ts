/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { derived, type Readable, writable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import type { PeriodicNotes } from "../../../service/periodic-notes";
import { WorkspaceFacade } from "../../../service/workspace-facade";
import type { DayPlannerSettings } from "../../../settings";
import type {
  EditableTimeBlock,
  RemoteTimeBlock,
  TimelineTimeBlock,
  WithDuration,
  WithPlacing,
} from "../../../time-block-types";
import type {
  OnEditAbortedFn,
  OnUpdateFn,
  PointerDateTime,
} from "../../../types";
import { uniqBy } from "../../../util/collection";
import * as m from "../../../util/moment";
import type { Moment } from "../../../util/obsidian-moment";
import * as t from "../../../util/time-block-utils";

import { createEditHandlers } from "./create-edit-handlers";
import { useCursor } from "./cursor";
import { transform } from "./transform/transform";
import type { EditOperation } from "./types";
import { useEditActions } from "./use-edit-actions";

const allDayPathCollator = new Intl.Collator("ko", {
  numeric: true,
  sensitivity: "base",
});

function compareText(left: string, right: string) {
  const localized = allDayPathCollator.compare(
    left.normalize("NFC"),
    right.normalize("NFC"),
  );

  if (localized !== 0) {
    return localized;
  }

  return left < right ? -1 : left > right ? 1 : 0;
}

function getAllDaySourceRank(timeBlock: TimelineTimeBlock) {
  switch (timeBlock.source) {
    case "ical":
      return 0;
    case "dailyNoteDate":
      return 1;
    case "tasksPluginProp":
      return 2;
    case "unwritten":
      return 3;
  }
}

function compareAllDayTimeBlocks(
  left: TimelineTimeBlock,
  right: TimelineTimeBlock,
) {
  const dateComparison = t
    .getDayKey(left.startTime)
    .localeCompare(t.getDayKey(right.startTime));

  if (dateComparison !== 0) {
    return dateComparison;
  }

  const sourceComparison =
    getAllDaySourceRank(left) - getAllDaySourceRank(right);

  if (sourceComparison !== 0) {
    return sourceComparison;
  }

  if (left.source === "ical" && right.source === "ical") {
    return (
      compareText(left.calendar.name, right.calendar.name) ||
      compareText(left.summary, right.summary) ||
      compareText(left.id, right.id)
    );
  }

  const leftIsIndexed =
    left.source === "dailyNoteDate" || left.source === "tasksPluginProp";
  const rightIsIndexed =
    right.source === "dailyNoteDate" || right.source === "tasksPluginProp";

  if (leftIsIndexed && rightIsIndexed) {
    return (
      compareText(left.path, right.path) ||
      left.position.start.line - right.position.start.line ||
      left.position.start.col - right.position.start.col ||
      compareText(left.id, right.id)
    );
  }

  return compareText(left.id, right.id);
}

function groupByDay(timeBlocks: TimelineTimeBlock[]) {
  return timeBlocks.reduce<
    Record<
      string,
      { withTime: TimelineTimeBlock[]; noTime: TimelineTimeBlock[] }
    >
  >((result, timeBlock) => {
    const key = t.getDayKey(timeBlock.startTime);

    if (!result[key]) {
      result[key] = { withTime: [], noTime: [] };
    }

    if (timeBlock.isAllDayEvent) {
      result[key].noTime.push(timeBlock);
    } else {
      result[key].withTime.push(timeBlock);
    }

    return result;
  }, {});
}

export function useEditContext(props: {
  workspaceFacade: WorkspaceFacade;
  periodicNotes: PeriodicNotes;
  onUpdate: OnUpdateFn;
  settings: Readable<DayPlannerSettings>;
  localTasks: Readable<EditableTimeBlock[]>;
  remoteTasks: Readable<RemoteTimeBlock[]>;
  pointerDateTime: Readable<PointerDateTime>;
  abortEditTrigger: Readable<unknown>;
  onEditAborted: OnEditAbortedFn;
}) {
  const {
    workspaceFacade,
    periodicNotes,
    onEditAborted,
    onUpdate,
    settings,
    localTasks: localTimeBlocks,
    remoteTasks: remoteTimeBlocks,
    pointerDateTime,
    abortEditTrigger,
  } = props;

  const editOperation = writable<EditOperation | undefined>(
    undefined,
    (set, updateEditOperation) => {
      const unsubscribe = abortEditTrigger.subscribe(() => {
        updateEditOperation((currentEditOperation) => {
          if (currentEditOperation !== undefined) {
            onEditAborted();
          }

          return undefined;
        });
      });

      return unsubscribe;
    },
  );
  const cursor = useCursor(editOperation);

  const localFilteredTimeBlocks = derived(
    [localTimeBlocks, settings],
    ([$localTimeBlocks, $settings]) =>
      $settings.showCompletedTasks
        ? $localTimeBlocks
        : $localTimeBlocks.filter(
            (timeBlock) => !t.isCompleted(timeBlock.task ?? timeBlock.status),
          ),
  );

  const baselineTimeBlocks = writable<EditableTimeBlock[]>([], (set) => {
    return localFilteredTimeBlocks.subscribe(set);
  });

  const timeBlocksWithPendingUpdate = derived(
    [editOperation, baselineTimeBlocks, settings, pointerDateTime],
    ([$editOperation, $baselineTimeBlocks, $settings, $pointerDateTime]) => {
      return $editOperation
        ? transform(
            $baselineTimeBlocks,
            $editOperation,
            $settings,
            $pointerDateTime,
          )
        : $baselineTimeBlocks;
    },
  );

  const { startEdit, confirmEdit, cancelEdit } = useEditActions({
    editOperation,
    baselineTasks: baselineTimeBlocks,
    tasksWithPendingUpdate: timeBlocksWithPendingUpdate,
    onUpdate,
  });

  const handlers = createEditHandlers({
    periodicNotes,
    pointerDateTime,
    workspaceFacade,
    startEdit,
    editOperation,
    settings,
  });

  const combinedTimeBlocks = derived(
    [remoteTimeBlocks, timeBlocksWithPendingUpdate],
    ([$remoteTimeBlocks, $timeBlocksWithPendingUpdate]): TimelineTimeBlock[] =>
      t.hideNestedLocalPlanTimeBlocks([
        ...$remoteTimeBlocks,
        ...$timeBlocksWithPendingUpdate,
      ]),
  );

  const dayToDisplayedTimeBlocks = derived(
    combinedTimeBlocks,
    ($combinedTimeBlocks) => {
      const split: TimelineTimeBlock[] = $combinedTimeBlocks.flatMap(
        (timeBlock): TimelineTimeBlock[] | TimelineTimeBlock => {
          if (!t.isWithDuration(timeBlock) || timeBlock.isAllDayEvent) {
            return timeBlock;
          }

          const daySpan = t
            .getEndTime(timeBlock)
            .diff(timeBlock.startTime, "days");
          const shouldGoToMultiDayRow = daySpan > 1;

          if (shouldGoToMultiDayRow) {
            return timeBlock;
          }

          const chunks = m.splitMultiday(
            timeBlock.startTime,
            t.getEndTime(timeBlock),
          );

          return chunks.map(([startTime, endTime]) => ({
            ...timeBlock,
            startTime,
            durationMinutes: m.getDiffInMinutes(startTime, endTime),
            timelineSegment: t.createTimelineSegment(
              timeBlock,
              startTime,
              endTime,
            ),
          }));
        },
      );

      return groupByDay(split);
    },
  );

  const getDisplayedAllDayTimeBlocksForMultiDayRow = derived(
    [combinedTimeBlocks],
    ([$combinedTimeBlocks]) =>
      (range: m.Range) => {
        const startOfRange = range.start.clone().startOf("day");
        const endOfRange = range.end.clone().add(1, "day").startOf("day");

        return $combinedTimeBlocks
          .filter((timeBlock) => {
            // TODO: a limitation to be removed later
            if (!timeBlock.isAllDayEvent) {
              return false;
            }

            if (t.isWithDuration(timeBlock)) {
              return m.doesOverlapWithRange(
                {
                  start: timeBlock.startTime,
                  end: t.getEndTime(timeBlock),
                },
                { start: startOfRange, end: endOfRange },
              );
            }

            return m.isWithinRange(timeBlock.startTime, range);
          })
          .map(
            (timeBlock): TimelineTimeBlock =>
              t.isWithDuration(timeBlock)
                ? t.truncateToRange(timeBlock, range)
                : timeBlock,
          )
          .toSorted(compareAllDayTimeBlocks);
      },
  );

  function getDisplayedTimeBlocksForTimeline(day: Moment) {
    return derived(dayToDisplayedTimeBlocks, ($dayToDisplayedTimeBlocks) => {
      const timeBlocksForDay =
        $dayToDisplayedTimeBlocks[t.getDayKey(day)] ||
        t.getEmptyTimeBlocksForDay();

      const withTime: Array<WithPlacing<WithDuration<TimelineTimeBlock>>> =
        addHorizontalPlacing(
          uniqBy(
            t.getRenderKey,
            timeBlocksForDay.withTime as Array<WithDuration<TimelineTimeBlock>>,
          ),
        );

      return {
        ...timeBlocksForDay,
        withTime,
      };
    });
  }

  return {
    handlers,
    cursor,
    dayToDisplayedTasks: dayToDisplayedTimeBlocks,
    confirmEdit,
    cancelEdit,
    editOperation,
    getDisplayedTasksForTimeline: getDisplayedTimeBlocksForTimeline,
    getDisplayedAllDayTasksForMultiDayRow:
      getDisplayedAllDayTimeBlocksForMultiDayRow,
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
