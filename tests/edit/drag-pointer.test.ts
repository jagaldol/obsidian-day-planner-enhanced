import moment from "moment";
import { describe, expect, test } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import {
  getDragPointerDateTime,
  getDragStartState,
  getResizeStartState,
  shouldUpdateDateTimePointer,
  withDragScrollOffset,
} from "../../src/ui/hooks/use-edit/drag-pointer";
import { EditMode } from "../../src/ui/hooks/use-edit/types";

import { baseTimeBlock } from "./util/fixtures";

const settings = {
  ...defaultSettingsForTests,
  snapStepMinutes: 10,
  startHour: 6,
  zoomLevel: 2,
};
const resizeSettings = { ...settings, zoomLevel: 1 };

describe("drag pointer time", () => {
  test("starts all-day drags without a relative timeline origin", () => {
    const timeBlock = {
      ...baseTimeBlock,
      isAllDayEvent: true,
      startTime: moment("2023-01-01 00:00"),
    };

    expect(getDragStartState(timeBlock, 120)).toMatchObject({
      dragOriginClientY: undefined,
      pointerDateTime: {
        dateTime: moment("2023-01-01 00:00"),
        type: "date",
      },
    });
  });

  test("all-day drags follow the absolute pointer position and scroll", () => {
    const timeBlock = {
      ...baseTimeBlock,
      isAllDayEvent: true,
      startTime: moment("2023-01-01 00:00"),
    };
    const operation = {
      dragOriginClientY: 120,
      dragOriginMinutes: 0,
      mode: EditMode.DRAG,
      timeBlock,
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
    const timeBlock = {
      ...baseTimeBlock,
      isAllDayEvent: false,
      startTime: moment("2023-01-01 10:00"),
    };

    expect(getDragStartState(timeBlock, 120)).toMatchObject({
      dragOriginClientY: 120,
      pointerDateTime: {
        dateTime: moment("2023-01-01 10:00"),
        type: "dateTime",
      },
    });

    const operation = {
      dragOriginClientY: 120,
      dragOriginMinutes: 10 * 60,
      mode: EditMode.DRAG,
      timeBlock,
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
    const timeBlock = {
      ...baseTimeBlock,
      isAllDayEvent: false,
      startTime: moment("2023-01-01 10:00"),
    };
    const operation = withDragScrollOffset(
      {
        dragOriginClientY: 120,
        dragOriginMinutes: 10 * 60,
        mode: EditMode.DRAG,
        timeBlock,
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
    const timeBlock = {
      ...baseTimeBlock,
      isAllDayEvent: false,
      startTime: moment("2023-01-01 10:00"),
    };
    const operation = {
      dragOriginClientY: 120,
      dragOriginMinutes: 10 * 60,
      mode: EditMode.DRAG,
      timeBlock,
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

  test.each([
    {
      description: "bottom",
      edgeTime: "12:40",
      fromTop: false,
      mode: EditMode.RESIZE,
      movedClientY: 308,
      movedTime: "12:50",
      nearlyStillClientY: 302,
    },
    {
      description: "top",
      edgeTime: "12:00",
      fromTop: true,
      mode: EditMode.RESIZE_FROM_TOP,
      movedClientY: 292,
      movedTime: "11:50",
      nearlyStillClientY: 298,
    },
  ])(
    "$description resize starts from the block edge instead of the floating control",
    ({
      edgeTime,
      fromTop,
      mode,
      movedClientY,
      movedTime,
      nearlyStillClientY,
    }) => {
      const timeBlock = {
        ...baseTimeBlock,
        durationMinutes: 40,
        isAllDayEvent: false,
        startTime: moment("2023-01-01 12:00"),
      };
      const startState = getResizeStartState(timeBlock, 300, fromTop);
      const operation = {
        dragOriginClientY: startState.dragOriginClientY,
        dragOriginMinutes: startState.dragOriginMinutes,
        mode,
        timeBlock,
      };
      const getDateTime = (clientY: number) =>
        getDragPointerDateTime({
          clientY,
          day: moment("2023-01-01"),
          operation,
          settings: resizeSettings,
          timelineOffsetY: 840,
        });

      expect(startState.pointerDateTime.dateTime).toEqual(
        moment(`2023-01-01 ${edgeTime}`),
      );
      expect(getDateTime(nearlyStillClientY)).toEqual(
        moment(`2023-01-01 ${edgeTime}`),
      );
      expect(getDateTime(movedClientY)).toEqual(
        moment(`2023-01-01 ${movedTime}`),
      );
    },
  );

  test("bottom resize keeps a midnight edge on the following day", () => {
    const timeBlock = {
      ...baseTimeBlock,
      durationMinutes: 30,
      isAllDayEvent: false,
      startTime: moment("2023-01-01 23:30"),
    };
    const startState = getResizeStartState(timeBlock, 300, false);

    expect(startState.dragOriginMinutes).toBe(24 * 60);
    expect(startState.pointerDateTime.dateTime).toEqual(
      moment("2023-01-02 00:00"),
    );
    expect(
      getDragPointerDateTime({
        clientY: 302,
        day: moment("2023-01-01"),
        operation: {
          dragOriginClientY: startState.dragOriginClientY,
          dragOriginMinutes: startState.dragOriginMinutes,
          mode: EditMode.RESIZE,
          timeBlock,
        },
        settings: resizeSettings,
        timelineOffsetY: 0,
      }),
    ).toEqual(moment("2023-01-02 00:00"));
  });
});
