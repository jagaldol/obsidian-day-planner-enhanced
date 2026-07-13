import moment from "moment";
import { describe, expect, test } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import {
  getDragPointerDateTime,
  getDragStartState,
  shouldUpdateDateTimePointer,
  withDragScrollOffset,
} from "../../src/ui/hooks/use-edit/drag-pointer";
import { EditMode } from "../../src/ui/hooks/use-edit/types";

import { baseTask } from "./util/fixtures";

const settings = {
  ...defaultSettingsForTests,
  snapStepMinutes: 10,
  startHour: 6,
  zoomLevel: 2,
};

describe("drag pointer time", () => {
  test("starts all-day drags without a relative timeline origin", () => {
    const task = {
      ...baseTask,
      isAllDayEvent: true,
      startTime: moment("2023-01-01 00:00"),
    };

    expect(getDragStartState(task, 120)).toMatchObject({
      dragOriginClientY: undefined,
      pointerDateTime: {
        dateTime: moment("2023-01-01 00:00"),
        type: "date",
      },
    });
  });

  test("all-day drags follow the absolute pointer position and scroll", () => {
    const task = {
      ...baseTask,
      isAllDayEvent: true,
      startTime: moment("2023-01-01 00:00"),
    };
    const operation = {
      dragOriginClientY: 120,
      dragOriginStartTime: task.startTime.clone(),
      mode: EditMode.DRAG,
      task,
    };
    const getDateTime = (timelineOffsetY: number) =>
      getDragPointerDateTime({
        clientY: 120,
        day: moment("2023-01-01"),
        operation,
        settings,
        timelineOffsetY,
      });

    expect(getDateTime(840)).toEqual(moment("2023-01-01 13:00"));
    expect(getDateTime(960)).toEqual(moment("2023-01-01 14:00"));
  });

  test("switches an all-day pointer to the timeline at the same midnight", () => {
    const midnight = moment("2023-01-01 00:00");

    expect(
      shouldUpdateDateTimePointer(
        { dateTime: midnight.clone(), type: "date" },
        midnight,
      ),
    ).toBe(true);
    expect(
      shouldUpdateDateTimePointer(
        { dateTime: midnight.clone(), type: "dateTime" },
        midnight,
      ),
    ).toBe(false);
  });

  test("timed drags preserve their relative pointer offset", () => {
    const task = {
      ...baseTask,
      isAllDayEvent: false,
      startTime: moment("2023-01-01 10:00"),
    };

    expect(getDragStartState(task, 120)).toMatchObject({
      dragOriginClientY: 120,
      pointerDateTime: {
        dateTime: moment("2023-01-01 10:00"),
        type: "dateTime",
      },
    });

    const operation = {
      dragOriginClientY: 120,
      dragOriginStartTime: task.startTime.clone(),
      mode: EditMode.DRAG,
      task,
    };

    expect(
      getDragPointerDateTime({
        clientY: 160,
        day: moment("2023-01-01"),
        operation,
        settings,
        timelineOffsetY: 840,
      }),
    ).toEqual(moment("2023-01-01 10:20"));
  });

  test("timed drags include auto-scroll movement while the pointer is still", () => {
    const task = {
      ...baseTask,
      isAllDayEvent: false,
      startTime: moment("2023-01-01 10:00"),
    };
    const operation = withDragScrollOffset(
      {
        dragOriginClientY: 120,
        dragOriginStartTime: task.startTime.clone(),
        mode: EditMode.DRAG,
        task,
      },
      40,
    );

    expect(operation.dragScrollOffsetY).toBe(40);

    expect(
      getDragPointerDateTime({
        clientY: 120,
        day: moment("2023-01-01"),
        operation,
        settings,
        timelineOffsetY: 880,
      }),
    ).toEqual(moment("2023-01-01 10:20"));
  });

  test("timed drags adopt the hovered timeline day", () => {
    const task = {
      ...baseTask,
      isAllDayEvent: false,
      startTime: moment("2023-01-01 10:00"),
    };
    const operation = {
      dragOriginClientY: 120,
      dragOriginStartTime: task.startTime.clone(),
      mode: EditMode.DRAG,
      task,
    };

    expect(
      getDragPointerDateTime({
        clientY: 160,
        day: moment("2023-01-02"),
        operation,
        settings,
        timelineOffsetY: 840,
      }),
    ).toEqual(moment("2023-01-02 10:20"));
  });
});
