import type { ListItemCache, Pos } from "obsidian";
import { afterEach, describe, expect, test } from "vitest";

import { configureTimestampRegExps } from "../../src/regexp";
import { ObsidianTasksExtensionService } from "../../src/service/index/extensions/obsidian-tasks-extension-service";
import type { RawListItemEntryWithContext } from "../../src/service/index/list-item-index-extension-service";
import { defaultSettingsForTests } from "../../src/settings";

const position: Pos = {
  start: { line: 0, col: 0, offset: 0 },
  end: { line: 0, col: 0, offset: 0 },
};

function indexScheduledTask({
  defaultDurationMinutes = 30,
  text,
}: {
  defaultDurationMinutes?: number;
  text: string;
}) {
  const service = new ObsidianTasksExtensionService({
    ...defaultSettingsForTests,
    defaultDurationMinutes,
  });
  const input: RawListItemEntryWithContext = {
    listItemCache: {
      parent: -1,
      position,
      task: " ",
    } as ListItemCache,
    listItemText: text,
    rawListItemEntry: {
      id: "test.md::0",
      path: "test.md",
      position,
      symbol: "-",
      task: " ",
      text,
    },
  };

  return service.forFile()(input).planEntries;
}

afterEach(() => configureTimestampRegExps("HH:mm"));

describe("Obsidian Tasks scheduled timestamps", () => {
  test("uses the default duration for a tagged single HH:mm time", () => {
    expect(
      indexScheduledTask({
        text: "#task/Flexible 10:00 TEST ⏳ 2026-07-27",
      }),
    ).toEqual([
      expect.objectContaining({
        dayKeys: ["2026-07-27"],
        end: "2026-07-27 10:30:00",
        start: "2026-07-27 10:00:00",
      }),
    ]);
  });

  test("uses the configured duration for a tagged single HHmm time", () => {
    configureTimestampRegExps("HHmm");

    expect(
      indexScheduledTask({
        defaultDurationMinutes: 40,
        text: "#task/Flexible 1000 TEST ⏳ 2026-07-27",
      }),
    ).toEqual([
      expect.objectContaining({
        dayKeys: ["2026-07-27"],
        end: "2026-07-27 10:40:00",
        start: "2026-07-27 10:00:00",
      }),
    ]);
  });

  test.each([
    "1000 Direct compact task ⏳ 2026-07-27",
    "#task/Flexible Review code 1000 ⏳ 2026-07-27",
  ])("keeps ambiguous compact text all-day: %s", (text) => {
    configureTimestampRegExps("HHmm");

    expect(indexScheduledTask({ text })).toEqual([
      expect.objectContaining({
        dayKeys: ["2026-07-27"],
        isAllDay: true,
        start: "2026-07-27 00:00:00",
      }),
    ]);
  });

  test("ignores invalid scheduled dates", () => {
    expect(indexScheduledTask({ text: "Task ⏳ 2026-99-99" })).toEqual([]);
  });
});
