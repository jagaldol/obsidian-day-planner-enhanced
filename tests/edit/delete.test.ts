import moment from "moment";
import { describe, expect, test } from "vitest";

import {
  createTransaction,
  getTimeBlockDiffFromEditState,
  mapTimeBlockDiffToUpdates,
} from "../../src/service/diff-writer";
import type { PeriodicNotes } from "../../src/service/periodic-notes";
import { defaultSettingsForTests } from "../../src/settings";

import { baseTimeBlock } from "./util/fixtures";

describe("delete edits", () => {
  test("maps a missing time block to a deleted update", () => {
    const deletedTimeBlock = {
      ...baseTimeBlock,
      id: "deleted",
      text: "09:00 - 10:00 Remove me\nnotes",
      startTime: moment("2023-01-01 09:00"),
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
    };
    const keptTimeBlock = {
      ...baseTimeBlock,
      id: "kept",
      text: "11:00 - 12:00 Keep me",
      startTime: moment("2023-01-01 11:00"),
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
    };

    const diff = getTimeBlockDiffFromEditState(
      [deletedTimeBlock, keptTimeBlock],
      [keptTimeBlock],
    );

    expect(diff).toMatchObject({
      deleted: [deletedTimeBlock],
      updated: [],
      added: [],
    });

    const updates = mapTimeBlockDiffToUpdates(
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
