import moment from "moment";
import { afterEach, it, expect } from "vitest";

import {
  getTimeFromLine,
  replaceOrPrependTimeRange,
} from "../src/parser/parser";
import { parseTime } from "../src/parser/time";
import { configureTimestampRegExps } from "../src/regexp";
import {
  createTimestamp,
  createTimestampParts,
  removeTimeRange,
} from "../src/util/time-block-utils";

afterEach(() => configureTimestampRegExps("HH:mm"));

it.each([
  ["13:00", { hours: 13, minutes: 0 }],
  ["1300", { hours: 13, minutes: 0 }],
  ["13.00", { hours: 13, minutes: 0 }],
  ["3:00", { hours: 3, minutes: 0 }],
  ["0700", { hours: 7, minutes: 0 }],
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

it("Parses 2400 as the next midnight", () => {
  expect(
    parseTime("2400", moment("2023-01-01")).isSame("2023-01-02 00:00"),
  ).toBe(true);
});

it.each([
  ["1:71"],
  ["19pm"],
  ["24:01"],
  ["2401"],
  ["29:00"],
  ["2900"],
  ["2360"],
  ["0301  pm"],
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
    line: "- [x] 0700 - 0840 Watched a video",
    start: "2023-01-01 07:00",
    durationMinutes: 100,
  },
  {
    line: "- [ ] 00:30 - 0700 Sleep",
    start: "2023-01-01 00:30",
    durationMinutes: 390,
  },
  {
    line: "- [ ] 0700 - 08:40 Mixed range",
    start: "2023-01-01 07:00",
    durationMinutes: 100,
  },
  {
    line: "- [ ] 2300 - 2400 Day end",
    start: "2023-01-01 23:00",
    durationMinutes: 60,
  },
])(
  "Reads compact 24-hour range from $line",
  ({ line, start, durationMinutes }) => {
    configureTimestampRegExps("HHmm");

    expect(
      getTimeFromLine({
        day: moment("2023-01-01"),
        line,
      }),
    ).toMatchObject({
      durationMinutes,
      startTime: moment(start),
    });
  },
);

it.each(["0700 exercise", "0700 - 0840 exercise", "2026 goals"])(
  "Does not read %s as a timestamp with HH:mm",
  (line) => {
    expect(getTimeFromLine({ day: moment("2023-01-01"), line })).toBeNull();
  },
);

it.each(["0700 exercise", "2026 goals"])(
  "Does not read ambiguous compact text %s with HHmm",
  (line) => {
    configureTimestampRegExps("HHmm");

    expect(getTimeFromLine({ day: moment("2023-01-01"), line })).toBeNull();
  },
);

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

it("Does not read embedded clock text as a schedule time", () => {
  expect(
    getTimeFromLine({
      day: moment("2023-01-01"),
      line: "Review the error logged at 15:36",
    }),
  ).toBeNull();
  expect(
    getTimeFromLine({
      day: moment("2023-01-01"),
      line: "- [ ] Review the error logged at 15:36",
    }),
  ).toBeNull();
  expect(
    getTimeFromLine({
      day: moment("2023-01-01"),
      line: "[ ] Review the error logged at 15:36",
    }),
  ).toBeNull();
  expect(
    getTimeFromLine({
      day: moment("2023-01-01"),
      line: "[ ] 12:00 Root",
    }),
  ).toMatchObject({ startTime: moment("2023-01-01 12:00") });
});

it.each([
  "- [ ] #task/Highpriority 08:50 - 09:50 Fix the parser ⏳ 2026-07-26",
  "[ ] #task #work/project 08:50 - 09:50 Fix the parser",
  "#task/Highpriority 08:50 - 09:50 Fix the parser",
])("Reads a complete time range immediately after leading tags: %s", (line) => {
  expect(
    getTimeFromLine({
      day: moment("2026-07-26"),
      line,
    }),
  ).toMatchObject({
    durationMinutes: 60,
    startTime: moment("2026-07-26 08:50"),
  });
});

it.each([
  {
    line: "- [ ] #task/Flexible 10:00 TEST ⏳ 2026-07-27",
    start: "2026-07-27 10:00",
  },
  {
    line: "[ ] #task #work/project 08:50 Fix the parser",
    start: "2026-07-27 08:50",
  },
  {
    line: "#task/Highpriority 08:50 Fix the parser",
    start: "2026-07-27 08:50",
  },
])(
  "Reads a single time immediately after leading tags: $line",
  ({ line, start }) => {
    expect(
      getTimeFromLine({
        day: moment("2026-07-27"),
        line,
      }),
    ).toEqual({
      durationMinutes: undefined,
      startTime: moment(start),
    });
  },
);

it.each([
  "#task/Highpriority Review the error logged at 15:36",
  "#task/Highpriority Notes 08:50 - 09:50",
])("Does not read embedded time after leading tags: %s", (line) => {
  expect(getTimeFromLine({ day: moment("2026-07-26"), line })).toBeNull();
});

it.each([
  {
    line: "- [ ] #task/Flexible 1000 TEST ⏳ 2026-07-27",
    start: "2026-07-27 10:00",
  },
  {
    line: "[ ] #task #work/project 0850 Fix the parser",
    start: "2026-07-27 08:50",
  },
  {
    line: "#task/Highpriority 0850 Fix the parser",
    start: "2026-07-27 08:50",
  },
])(
  "Reads compact single time immediately after leading tags: $line",
  ({ line, start }) => {
    configureTimestampRegExps("HHmm");

    expect(
      getTimeFromLine({
        day: moment("2026-07-27"),
        line,
      }),
    ).toEqual({
      durationMinutes: undefined,
      startTime: moment(start),
    });
  },
);

it.each([
  "1000 Direct compact text",
  "- [ ] 1000 Direct compact task",
  "#task/Flexible Review code 1000",
  "#task/Flexible Notes 0850 - 0950",
])("Keeps ambiguous compact text untimed with HHmm: %s", (line) => {
  configureTimestampRegExps("HHmm");

  expect(getTimeFromLine({ day: moment("2026-07-27"), line })).toBeNull();
});

it("Only replaces a leading time range", () => {
  expect(
    replaceOrPrependTimeRange(
      "Review the error logged at 15:36",
      "10:00 - 10:30",
    ),
  ).toBe("10:00 - 10:30 Review the error logged at 15:36");
  expect(replaceOrPrependTimeRange("09:00 Old title", "10:00 - 10:30")).toBe(
    "10:00 - 10:30 Old title",
  );
  expect(
    replaceOrPrependTimeRange(
      "- [ ] Review the error logged at 15:36",
      "10:00 - 10:30",
    ),
  ).toBe("- [ ] 10:00 - 10:30 Review the error logged at 15:36");
  expect(
    replaceOrPrependTimeRange("- [ ] 09:00 Old title", "10:00 - 10:30"),
  ).toBe("- [ ] 10:00 - 10:30 Old title");
  expect(
    replaceOrPrependTimeRange(
      "[ ] Review the error logged at 15:36",
      "10:00 - 10:30",
    ),
  ).toBe("[ ] 10:00 - 10:30 Review the error logged at 15:36");
  expect(replaceOrPrependTimeRange("2026 goals", "10:00 - 10:30")).toBe(
    "10:00 - 10:30 2026 goals",
  );
});

it("Keeps leading tags before a replaced or inserted time range", () => {
  expect(
    replaceOrPrependTimeRange(
      "- [ ] #task/Highpriority 08:50 - 09:50 Old title",
      "10:00 - 10:30",
    ),
  ).toBe("- [ ] #task/Highpriority 10:00 - 10:30 Old title");
  expect(
    replaceOrPrependTimeRange(
      "- [ ] #task/Highpriority 08:50 Old title",
      "10:00 - 10:30",
    ),
  ).toBe("- [ ] #task/Highpriority 10:00 - 10:30 Old title");
  expect(
    replaceOrPrependTimeRange(
      "- [ ] #task/Highpriority Untimed title",
      "10:00 - 10:30",
    ),
  ).toBe("- [ ] #task/Highpriority 10:00 - 10:30 Untimed title");
  expect(
    replaceOrPrependTimeRange(
      "#task #work/project Untimed title",
      "10:00 - 10:30",
    ),
  ).toBe("#task #work/project 10:00 - 10:30 Untimed title");
});

it("Only removes a leading time range", () => {
  expect(removeTimeRange("Review the error logged at 15:36")).toBe(
    "Review the error logged at 15:36",
  );
  expect(removeTimeRange("09:00 Review the error logged at 15:36")).toBe(
    "Review the error logged at 15:36",
  );
  expect(
    removeTimeRange("- [ ] 09:00 - 10:00 Review the error logged at 15:36"),
  ).toBe("- [ ] Review the error logged at 15:36");
  expect(removeTimeRange("- Review the error logged at 15:36")).toBe(
    "- Review the error logged at 15:36",
  );
  expect(
    removeTimeRange("[ ] 09:00 - 10:00 Review the error logged at 15:36"),
  ).toBe("[ ] Review the error logged at 15:36");
  expect(removeTimeRange("- [ ] 2026 goals")).toBe("- [ ] 2026 goals");
});

it("Removes only the time range after leading tags", () => {
  expect(
    removeTimeRange(
      "- [ ] #task/Highpriority 08:50 - 09:50 Fix the parser ⏳ 2026-07-26",
    ),
  ).toBe("- [ ] #task/Highpriority Fix the parser ⏳ 2026-07-26");
  expect(
    removeTimeRange("- [ ] #task #work/project 08:50 - 09:50 Fix the parser"),
  ).toBe("- [ ] #task #work/project Fix the parser");
  expect(removeTimeRange("- [ ] #task/Flexible 10:00 TEST ⏳ 2026-07-27")).toBe(
    "- [ ] #task/Flexible TEST ⏳ 2026-07-27",
  );
});

it("Removes compact ranges and tagged single times with HHmm", () => {
  configureTimestampRegExps("HHmm");

  expect(removeTimeRange("- [ ] 0700 - 0840 Exercise")).toBe("- [ ] Exercise");
  expect(removeTimeRange("- [ ] #task/Highpriority 0700 - 0840 Exercise")).toBe(
    "- [ ] #task/Highpriority Exercise",
  );
  expect(removeTimeRange("- [ ] #task/Flexible 1000 TEST")).toBe(
    "- [ ] #task/Flexible TEST",
  );
  expect(removeTimeRange("- [ ] 1000 Direct compact task")).toBe(
    "- [ ] 1000 Direct compact task",
  );
});
