import { snap } from "../../../global-store/derived-settings";
import type { DayPlannerSettings } from "../../../settings";
import type {
  EditableTimeBlock,
  WithDuration,
} from "../../../time-block-types";
import type { PointerDateTime } from "../../../types";
import { offsetYToMinutes } from "../../../util/dom";
import {
  getMinutesSinceMidnight,
  minutesToMomentOfDay,
} from "../../../util/moment";
import type { Moment } from "../../../util/obsidian-moment";

import type { EditOperation } from "./types";

export function getDragStartState(
  task: WithDuration<EditableTimeBlock>,
  clientY: number,
): {
  dragOriginClientY?: number;
  pointerDateTime: PointerDateTime;
} {
  const isAllDayDrag = task.isAllDayEvent === true;

  return {
    dragOriginClientY: isAllDayDrag ? undefined : clientY,
    pointerDateTime: {
      dateTime: task.startTime.clone(),
      type: isAllDayDrag ? "date" : "dateTime",
    },
  };
}

export function getDragPointerDateTime(props: {
  clientY: number;
  day: Moment;
  operation: EditOperation;
  settings: DayPlannerSettings;
  timelineOffsetY: number;
}) {
  const { clientY, day, operation, settings, timelineOffsetY } = props;

  if (isRelativeDragOperation(operation)) {
    const {
      dragOriginClientY,
      dragOriginStartTime,
      dragScrollOffsetY = 0,
    } = operation;
    const deltaMinutes =
      (clientY - dragOriginClientY + dragScrollOffsetY) / settings.zoomLevel;
    const snappedDeltaMinutes =
      Math.round(deltaMinutes / settings.snapStepMinutes) *
      settings.snapStepMinutes;
    const targetMinutes =
      getMinutesSinceMidnight(dragOriginStartTime) + snappedDeltaMinutes;

    return minutesToMomentOfDay(targetMinutes, day);
  }

  const snappedTimelineOffsetY = snap(timelineOffsetY, settings);
  const minutesSinceMidnight = offsetYToMinutes(
    snappedTimelineOffsetY,
    settings.zoomLevel,
    settings.startHour,
  );

  return minutesToMomentOfDay(minutesSinceMidnight, day);
}

export function isRelativeDragOperation(
  operation: EditOperation,
): operation is EditOperation & {
  dragOriginClientY: number;
  dragOriginStartTime: Moment;
} {
  return (
    operation.task.isAllDayEvent !== true &&
    operation.dragOriginClientY !== undefined &&
    operation.dragOriginStartTime !== undefined
  );
}

export function withDragScrollOffset(
  operation: EditOperation,
  scrollDeltaY: number,
) {
  if (!isRelativeDragOperation(operation) || scrollDeltaY === 0) {
    return operation;
  }

  return {
    ...operation,
    dragScrollOffsetY: (operation.dragScrollOffsetY ?? 0) + scrollDeltaY,
  };
}

export function shouldUpdateDateTimePointer(
  current: PointerDateTime,
  nextDateTime: Moment,
) {
  return (
    current.type !== "dateTime" ||
    !nextDateTime.isSame(current.dateTime, "minute")
  );
}
