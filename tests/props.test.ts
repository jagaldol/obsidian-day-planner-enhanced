import { expect, test } from "vitest";

import {
  deleteLogEntry,
  editLastLogEntry,
  editLogEntry,
  type Props,
} from "../src/util/props";

function propsWithDuplicateStarts(): Props {
  return {
    planner: {
      log: [
        {
          start: "2025-01-01 13:00",
          end: "2025-01-01 15:00",
        },
        {
          start: "2025-01-01 13:00",
          end: "2025-01-01 17:00",
        },
      ],
    },
  };
}

test("edits the indexed log entry when start times are duplicated", () => {
  const updated = editLogEntry(propsWithDuplicateStarts(), {
    logIndex: 1,
    originalStart: "2025-01-01 13:00",
    patch: { end: "2025-01-01 18:00" },
  });

  expect(updated.planner?.log).toEqual([
    {
      start: "2025-01-01 13:00",
      end: "2025-01-01 15:00",
    },
    {
      start: "2025-01-01 13:00",
      end: "2025-01-01 18:00",
    },
  ]);
});

test("deletes the indexed log entry when start times are duplicated", () => {
  const updated = deleteLogEntry(propsWithDuplicateStarts(), {
    logIndex: 1,
    originalStart: "2025-01-01 13:00",
  });

  expect(updated.planner?.log).toEqual([
    {
      start: "2025-01-01 13:00",
      end: "2025-01-01 15:00",
    },
  ]);
});

test("edits the actual last log entry when start times are duplicated", () => {
  const updated = editLastLogEntry(propsWithDuplicateStarts(), {
    end: "2025-01-01 18:00",
  });

  expect(updated.planner?.log?.[0]?.end).toBe("2025-01-01 15:00");
  expect(updated.planner?.log?.[1]?.end).toBe("2025-01-01 18:00");
});

test("rejects a stale indexed log locator instead of editing another entry", () => {
  expect(() =>
    editLogEntry(propsWithDuplicateStarts(), {
      logIndex: 1,
      originalStart: "2025-01-01 12:00",
      patch: { end: "2025-01-01 18:00" },
    }),
  ).toThrow("Log entry not found: 2025-01-01 12:00");
});
