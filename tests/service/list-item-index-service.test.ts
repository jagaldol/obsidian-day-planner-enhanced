import type { CachedMetadata, ListItemCache, Pos } from "obsidian";
import { describe, expect, test } from "vitest";

import { DailyNoteExtensionService } from "../../src/service/index/extensions/daily-note-extension-service";
import { ObsidianTasksExtensionService } from "../../src/service/index/extensions/obsidian-tasks-extension-service";
import { ListItemIndexService } from "../../src/service/index/list-item-index-service";
import type { PeriodicNotes } from "../../src/service/periodic-notes";
import { defaultSettingsForTests } from "../../src/settings";

const dailyNotePath = "2026-08-02.md";
const dailyNoteDate = "2026-08-02";

function indexDailyTask(taskText: string) {
  const headingLine = "# Day planner";
  const listItemLine = `- [ ] ${taskText}`;
  const text = `${headingLine}\n\n${listItemLine}`;
  const listItemStartOffset = headingLine.length + 2;
  const listItemPosition: Pos = {
    start: { line: 2, col: 0, offset: listItemStartOffset },
    end: {
      line: 2,
      col: listItemLine.length,
      offset: listItemStartOffset + listItemLine.length,
    },
  };
  const metadata = {
    headings: [
      {
        heading: "Day planner",
        level: 1,
        position: {
          start: { line: 0, col: 0, offset: 0 },
          end: {
            line: 0,
            col: headingLine.length,
            offset: headingLine.length,
          },
        },
      },
    ],
    listItems: [
      {
        parent: -1,
        position: listItemPosition,
        task: " ",
      } as ListItemCache,
    ],
  } as CachedMetadata;
  const periodicNotes = {
    getDateFromPath: (path: string) =>
      path === dailyNotePath ? window.moment(dailyNoteDate) : undefined,
  } as unknown as PeriodicNotes;
  const service = new ListItemIndexService([
    new DailyNoteExtensionService(periodicNotes, defaultSettingsForTests),
    new ObsidianTasksExtensionService(defaultSettingsForTests),
  ]);

  return service.index({ path: dailyNotePath, text, metadata });
}

describe("List item plan-entry precedence", () => {
  test.each([
    "Task scheduled with Tasks ⏳ 2026-08-01",
    "Task scheduled with Dataview [scheduled:: 2026-08-01]",
    "Task scheduled with keyless Dataview (scheduled:: 2026-08-01)",
  ])(
    "uses an explicit scheduled date instead of the containing daily-note date: %s",
    (taskText) => {
      const result = indexDailyTask(taskText);

      expect(result.planEntries).toEqual([
        expect.objectContaining({
          dayKeys: ["2026-08-01"],
          isAllDay: true,
          source: "tasksPluginProp",
        }),
      ]);
      expect(result.listItemEntries?.[0]?.planEntryIds).toHaveLength(1);
    },
  );

  test("keeps the daily-note date when there is no explicit scheduled date", () => {
    expect(indexDailyTask("Task without a scheduled date").planEntries).toEqual(
      [
        expect.objectContaining({
          dayKeys: [dailyNoteDate],
          isAllDay: true,
          source: "dailyNoteDate",
        }),
      ],
    );
  });

  test("falls back to the daily-note date for an invalid scheduled date", () => {
    expect(indexDailyTask("Task ⏳ 2026-99-99").planEntries).toEqual([
      expect.objectContaining({
        dayKeys: [dailyNoteDate],
        isAllDay: true,
        source: "dailyNoteDate",
      }),
    ]);
  });
});
