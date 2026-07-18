import type { TimelineSegment } from "../../time-block-types";

export type FloatingTimeBlockControl = "topEnd" | "bottom" | "top";

type TaskWithTimelineSegment = {
  timelineSegment?: Pick<
    TimelineSegment,
    "continuesAfterSegment" | "startsBeforeSegment"
  >;
};

export function getDisabledFloatingControls(
  task: TaskWithTimelineSegment,
): FloatingTimeBlockControl[] {
  const controls: FloatingTimeBlockControl[] = [];

  if (task.timelineSegment?.startsBeforeSegment) {
    controls.push("top", "topEnd");
  }

  if (task.timelineSegment?.continuesAfterSegment) {
    controls.push("bottom");
  }

  return controls;
}
