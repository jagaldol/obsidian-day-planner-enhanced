import moment from "moment";
import { describe, expect, test } from "vitest";

import {
  createTransaction,
  getTaskDiffFromEditState,
  mapTaskDiffToUpdates,
} from "../../src/service/diff-writer";
import type { PeriodicNotes } from "../../src/service/periodic-notes";
import { defaultSettingsForTests } from "../../src/settings";

import { baseTask } from "./util/fixtures";

describe("delete edits", () => {
  test("maps a missing task to a deleted update", () => {
    const deletedTask = {
      ...baseTask,
      id: "deleted",
      text: "09:00 - 10:00 Remove me\nnotes",
      startTime: moment("2023-01-01 09:00"),
      location: {
        path: "daily.md",
        position: {
          start: {
            line: 1,
            col: 0,
            offset: 7,
          },
          end: {
            line: 1,
            col: 0,
            offset: 7,
          },
        },
      },
    };
    const keptTask = {
      ...baseTask,
      id: "kept",
      text: "11:00 - 12:00 Keep me",
      startTime: moment("2023-01-01 11:00"),
      location: {
        path: "daily.md",
        position: {
          start: {
            line: 3,
            col: 0,
            offset: 41,
          },
          end: {
            line: 3,
            col: 0,
            offset: 41,
          },
        },
      },
    };

    const diff = getTaskDiffFromEditState([deletedTask, keptTask], [keptTask]);

    expect(diff).toMatchObject({
      deleted: [deletedTask],
      updated: [],
      added: [],
    });

    const updates = mapTaskDiffToUpdates(
      diff,
      defaultSettingsForTests,
      {} as PeriodicNotes,
    );
    const [transaction] = createTransaction({
      updates,
      settings: defaultSettingsForTests,
    });

    expect(
      transaction?.updateFn(
        ["heading", "- 09:00 - 10:00 Remove me", "  notes", "- Keep me"].join(
          "\n",
        ),
      ),
    ).toBe(["heading", "- Keep me"].join("\n"));
  });
});
