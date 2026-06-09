import moment from "moment";
import { it, expect } from "vitest";

import { getTimeFromLine } from "../src/parser/parser";
import { parseTime } from "../src/parser/time";
import { createTimestamp, createTimestampParts } from "../src/util/task-utils";

it.each([
  ["13:00", { hours: 13, minutes: 0 }],
  ["13.00", { hours: 13, minutes: 0 }],
  ["3:00", { hours: 3, minutes: 0 }],
  ["3.00", { hours: 3, minutes: 0 }],
  ["3.00am", { hours: 3, minutes: 0 }],
  ["12:30am", { hours: 0, minutes: 30 }],
  ["12:30pm", { hours: 12, minutes: 30 }],
  ["2:30am", { hours: 2, minutes: 30 }],
  ["2:30 am", { hours: 2, minutes: 30 }],
  ["02:30 am", { hours: 2, minutes: 30 }],
  ["0301pm", { hours: 15, minutes: 1 }],
  ["0301PM", { hours: 15, minutes: 1 }],
])("Parses timestamp %s", (asText, object) => {
  expect(parseTime(asText, moment()).toObject()).toMatchObject(object);
});

it("Parses 24:00 as the next midnight", () => {
  expect(
    parseTime("24:00", moment("2023-01-01")).isSame("2023-01-02 00:00"),
  ).toBe(true);
});

it.each([
  ["1:71"],
  ["19pm"],
  ["24:01"],
  ["29:00"],
  ["0301  pm"],
  ["0301"],
  ["1300"],
  ["13 00"],
  ["13"],
  ["3"],
  ["03"],
  ["3pm"],
  ["11 pm"],
  ["3PM"],
  ["11 PM"],
])("Does not parse %s", (asText) => {
  expect(() => parseTime(asText, moment())).toThrow();
});

it.each([
  {
    description: "same-day midnight end",
    durationMinutes: 30,
    result: "23:30 - 24:00",
  },
  {
    description: "cross-midnight end",
    durationMinutes: 40,
    result: "23:30 - 00:10",
  },
])("Creates timestamp for $description", ({ durationMinutes, result }) => {
  expect(createTimestamp(23 * 60 + 30, durationMinutes, "HH:mm")).toBe(result);
});

it("Creates timestamp parts with 24:00 for exact day-end display", () => {
  expect(createTimestampParts(23 * 60 + 30, 30, "HH:mm")).toEqual({
    end: "24:00",
    start: "23:30",
  });
});

it("Reads 24:00 as a same-day end boundary", () => {
  const result = getTimeFromLine({
    day: moment("2023-01-01"),
    line: "23:30 - 24:00 test",
  });

  expect(result).toMatchObject({
    durationMinutes: 30,
    startTime: moment("2023-01-01 23:30"),
  });
});

it("Reads an earlier end time as a next-day end boundary", () => {
  const result = getTimeFromLine({
    day: moment("2023-01-01"),
    line: "23:30 - 00:10 test",
  });

  expect(result).toMatchObject({
    durationMinutes: 40,
    startTime: moment("2023-01-01 23:30"),
  });
});
