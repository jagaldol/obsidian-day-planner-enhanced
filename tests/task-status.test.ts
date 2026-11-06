import { describe, expect, test } from "vitest";

import { parseHiddenTaskStatuses } from "../src/util/task-status";

describe("hidden task status input", () => {
  test.each([
    ["", []],
    ["  ", []],
    ["[-]", ["-"]],
    ["[-], [?], [ ]", ["-", "?", " "]],
    ["[/] [x] [X]", ["/", "x", "X"]],
    ["[-], [-]", ["-"]],
    ["[,]", [","]],
    ["[[] []]", ["[", "]"]],
  ])("parses %j", (input, expected) => {
    expect(parseHiddenTaskStatuses(input as string)).toEqual(expected);
  });

  test.each(["-", "[]", "[cancelled]", "[-], [", "[-], text", ",", "[\n]"])(
    "rejects incomplete or invalid input %j",
    (input) => {
      expect(parseHiddenTaskStatuses(input)).toBeUndefined();
    },
  );
});
