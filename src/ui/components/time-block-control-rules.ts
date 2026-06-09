import type { TimelineSegment } from "../../task-types";

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
    controls.push("top");
  }

  if (task.timelineSegment?.continuesAfterSegment) {
    controls.push("bottom");
  }

  return controls;
}
