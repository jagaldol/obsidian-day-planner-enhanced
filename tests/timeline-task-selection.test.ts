import moment from "moment";
import { describe, expect, test } from "vitest";

import {
  createTimelineTaskSelectionTarget,
  isLocatedTimelineTaskSelectionMatch,
  isTimelineTaskSelectionMatch,
} from "../src/global-store/timeline-task-selection";
import type { LocalTask } from "../src/task-types";

function createTask(overrides: Partial<LocalTask> = {}): LocalTask {
  return {
    durationMinutes: 30,
    id: "temporary-id",
    startTime: moment("2023-01-01 09:00"),
    symbol: "-",
    text: "Created task",
    ...overrides,
  };
}

describe("timeline task auto-selection", () => {
  test("matches the temporary created task by id", () => {
    const temporaryTask = createTask();
    const target = createTimelineTaskSelectionTarget(
      temporaryTask,
      "2023-01-01.md",
    );

    expect(isTimelineTaskSelectionMatch(temporaryTask, target)).toBe(true);
    expect(isLocatedTimelineTaskSelectionMatch(temporaryTask, target)).toBe(
      false,
    );
  });

  test("matches the indexed created task after its id changes", () => {
    const target = createTimelineTaskSelectionTarget(
      createTask(),
      "2023-01-01.md",
    );
    const indexedTask = createTask({
      id: "2023-01-01.md:3",
      location: {
        path: "2023-01-01.md",
        position: {
          start: {
            line: 3,
            col: 0,
            offset: 42,
          },
          end: {
            line: 3,
            col: 0,
            offset: 42,
          },
        },
      },
      text: "09:00 - 09:30 Created task",
    });

    expect(isTimelineTaskSelectionMatch(indexedTask, target)).toBe(true);
    expect(isLocatedTimelineTaskSelectionMatch(indexedTask, target)).toBe(true);
  });
});
