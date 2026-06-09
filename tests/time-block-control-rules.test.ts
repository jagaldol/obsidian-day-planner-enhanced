import { expect, it } from "vitest";

import { getDisabledFloatingControls } from "../src/ui/components/time-block-control-rules";

it.each([
  {
    description: "regular task",
    result: [],
    timelineSegment: undefined,
  },
  {
    description: "continued from previous day",
    result: ["top"],
    timelineSegment: {
      continuesAfterSegment: false,
      sourceDurationMinutes: 120,
      startsBeforeSegment: true,
    },
  },
  {
    description: "continues to next day",
    result: ["bottom"],
    timelineSegment: {
      continuesAfterSegment: true,
      sourceDurationMinutes: 120,
      startsBeforeSegment: false,
    },
  },
  {
    description: "continues across days",
    result: ["top", "bottom"],
    timelineSegment: {
      continuesAfterSegment: true,
      sourceDurationMinutes: 3 * 24 * 60,
      startsBeforeSegment: true,
    },
  },
])(
  "Disables resize controls for $description",
  ({ result, timelineSegment }) => {
    expect(
      getDisabledFloatingControls({
        timelineSegment,
      }),
    ).toEqual(result);
  },
);
