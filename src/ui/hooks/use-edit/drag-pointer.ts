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
import { getEndMinutes } from "../../../util/time-block-utils";

import type { EditOperation } from "./types";

export function getDragStartState(
  timeBlock: WithDuration<EditableTimeBlock>,
  clientY: number,
): {
  dragOriginClientY?: number;
  pointerDateTime: PointerDateTime;
} {
  const isAllDayDrag = timeBlock.isAllDayEvent === true;

  return {
    dragOriginClientY: isAllDayDrag ? undefined : clientY,
    pointerDateTime: {
      dateTime: timeBlock.startTime.clone(),
      type: isAllDayDrag ? "date" : "dateTime",
    },
  };
}

export function getResizeStartState(
  timeBlock: WithDuration<EditableTimeBlock>,
  clientY: number,
  fromTop: boolean,
): {
  dragOriginClientY: number;
  dragOriginMinutes: number;
  pointerDateTime: PointerDateTime;
} {
  const dragOriginMinutes = fromTop
    ? getMinutesSinceMidnight(timeBlock.startTime)
    : getEndMinutes(timeBlock);

  return {
    dragOriginClientY: clientY,
    dragOriginMinutes,
    pointerDateTime: {
      dateTime: minutesToMomentOfDay(dragOriginMinutes, timeBlock.startTime),
      type: "dateTime",
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
      dragOriginMinutes,
      dragScrollOffsetY = 0,
    } = operation;

    return getRelativePointerDateTime({
      clientY,
      day,
      dragOriginClientY,
      dragOriginMinutes,
      dragScrollOffsetY,
      settings,
    });
  }

  const snappedTimelineOffsetY = snap(timelineOffsetY, settings);
  const minutesSinceMidnight = offsetYToMinutes(
    snappedTimelineOffsetY,
    settings.zoomLevel,
    settings.startHour,
  );

  return minutesToMomentOfDay(minutesSinceMidnight, day);
}

export function getRelativePointerDateTime(props: {
  clientY: number;
  day: Moment;
  dragOriginClientY: number;
  dragOriginMinutes: number;
  dragScrollOffsetY?: number;
  settings: DayPlannerSettings;
}) {
  const {
    clientY,
    day,
    dragOriginClientY,
    dragOriginMinutes,
    dragScrollOffsetY = 0,
    settings,
  } = props;
  const deltaMinutes =
    (clientY - dragOriginClientY + dragScrollOffsetY) / settings.zoomLevel;
  const snappedDeltaMinutes =
    Math.round(deltaMinutes / settings.snapStepMinutes) *
    settings.snapStepMinutes;
  const targetMinutes = dragOriginMinutes + snappedDeltaMinutes;

  return minutesToMomentOfDay(targetMinutes, day);
}

export function isRelativeDragOperation(
  operation: EditOperation,
): operation is EditOperation & {
  dragOriginClientY: number;
  dragOriginMinutes: number;
} {
  return (
    operation.timeBlock.isAllDayEvent !== true &&
    operation.dragOriginClientY !== undefined &&
    operation.dragOriginMinutes !== undefined
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
