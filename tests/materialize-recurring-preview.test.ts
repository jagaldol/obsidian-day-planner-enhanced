import { describe, expect, test } from "vitest";

import type { PlanTimeBlock } from "../src/time-block-types";
import { insertRecurringOccurrence } from "../src/util/materialize-recurring-preview";
import {
  getRecurringPreviewForDay,
  prepareRecurringSource,
} from "../src/util/recurring-preview";

function makePreview(
  text = "15:00 - 17:00 Focus 🔁 every day ⏳ 2026-11-06",
  day = "2026-11-08",
  overrides: Partial<PlanTimeBlock> = {},
) {
  const source: PlanTimeBlock = {
    id: "source",
    path: "Recurring.md",
    source: "tasksPluginProp",
    symbol: "-",
    task: " ",
    text,
    startTime: window.moment("2026-11-06 15:00"),
    durationMinutes: 120,
    position: {
      start: { line: 1, col: 0, offset: 0 },
      end: { line: 1, col: 80, offset: 80 },
    },
    ...overrides,
  };
  return getRecurringPreviewForDay(prepareRecurringSource(source)!, day).find(
    (item) => item.occurrenceDay === day,
  )!;
}

const today = "2026-11-06";

describe("materializing recurring previews", () => {
  test("inserts just the selected occurrence before the source and preserves nested content and CRLF", () => {
    const preview = makePreview();
    const note = `# Plan\r\n- [ ] ${preview.source.text}\r\n    - [ ] Child\r\n\r\nOther text\r\n`;
    const result = insertRecurringOccurrence(note, preview, today);
    expect(result).toBe(
      `# Plan\r\n- [ ] 15:00 - 17:00 Focus 🔁 every day ⏳ 2026-11-08\r\n${note.slice(8)}`,
    );
    expect(() => insertRecurringOccurrence(result, preview, today)).toThrow(
      "already exists",
    );
  });

  test("handles all-day tasks and preserves date offsets, priority and tags without duplicating identifiers/history", () => {
    const text =
      "Focus #work 🔼 🔁 every day 🛫 2026-11-05 ⏳ 2026-11-06 📅 2026-11-07 ➕ 2026-10-01 ✅ 2026-10-30 🆔 abc123 ^focus";
    const preview = makePreview(text, "2026-11-08", {
      isAllDayEvent: true,
      startTime: window.moment(today),
    });
    const note = `# Plan\n- [ ] ${text}\n`;
    const result = insertRecurringOccurrence(note, preview, today);
    expect(result.split("\n")[1]).toBe(
      "- [ ] Focus #work 🔼 🔁 every day 🛫 2026-11-07 ⏳ 2026-11-08 📅 2026-11-09 ➕ 2026-11-06",
    );
    expect(result.endsWith(`- [ ] ${text}\n`)).toBe(true);
    expect(() => insertRecurringOccurrence(result, preview, today)).toThrow(
      "already exists",
    );
  });

  test("preserves inline syntax and adds an explicit date to daily-note tasks", () => {
    const text =
      "Focus [repeat:: every day] [created:: 2026-10-01] [id:: unique]";
    const preview = makePreview(text, "2026-11-08", {
      isAllDayEvent: true,
      source: "dailyNoteDate",
      startTime: window.moment(today),
    });
    const result = insertRecurringOccurrence(
      `# Plan\n- Parent\n    - [ ] ${text}\n`,
      preview,
      today,
    );
    expect(result.split("\n")[2]).toBe(
      "    - [ ] Focus [repeat:: every day] [created:: 2026-11-06] [scheduled:: 2026-11-08]",
    );
  });

  test("shifts inline start/scheduled/due dates without changing unrelated dates in the title", () => {
    const text =
      "15:00 - 17:00 Review 2026-11-01 [repeat:: every day] (start:: 2026-11-05) [scheduled:: 2026-11-06] [due:: 2026-11-07] (completion:: 2026-10-30)";
    const preview = makePreview(text);
    const result = insertRecurringOccurrence(
      `# Plan\n> - [ ] ${text}`,
      preview,
      today,
    );
    expect(result.split("\n")[1]).toBe(
      "> - [ ] 15:00 - 17:00 Review 2026-11-01 [repeat:: every day] (start:: 2026-11-07) [scheduled:: 2026-11-08] [due:: 2026-11-09]",
    );
  });

  test("handles a source shifted by unrelated edits, but rejects an edited/completed/deleted source", () => {
    const preview = makePreview();
    expect(
      insertRecurringOccurrence(
        `# Title\n\nUnrelated\n- [ ] ${preview.source.text}`,
        preview,
        today,
      ),
    ).toContain("⏳ 2026-11-08");
    for (const note of [
      "No task",
      `- [x] ${preview.source.text}`,
      `- [ ] ${preview.source.text} edited`,
      `\`\`\`\n- [ ] ${preview.source.text}\n\`\`\``,
    ]) {
      expect(() => insertRecurringOccurrence(note, preview, today)).toThrow(
        "changed or was removed",
      );
    }
  });

  test("does not confuse fenced examples with real occurrences", () => {
    const preview = makePreview();
    const note = `# Plan\n- [ ] ${preview.source.text}\n\n\`\`\`\n- [ ] 15:00 - 17:00 Focus 🔁 every day ⏳ 2026-11-08\n\`\`\``;
    expect(
      insertRecurringOccurrence(note, preview, today).split("\n")[1],
    ).toContain("⏳ 2026-11-08");
  });

  test("rejects an existing completed occurrence as well as an open one", () => {
    const preview = makePreview();
    for (const status of [" ", "x", "-"]) {
      const note = `# Plan\n- [ ] ${preview.source.text}\n- [${status}] 15:00 - 17:00 Focus 🔁 every day ⏳ 2026-11-08`;
      expect(() => insertRecurringOccurrence(note, preview, today)).toThrow(
        "already exists",
      );
    }
  });

  test("rejects past dates and dates outside the source recurrence", () => {
    const preview = makePreview(
      "Focus 🔁 every week ⏳ 2026-11-06",
      "2026-11-13",
      { isAllDayEvent: true },
    );
    const note = `# Plan\n- [ ] ${preview.source.text}`;
    expect(() =>
      insertRecurringOccurrence(note, preview, "2026-11-14"),
    ).toThrow("no longer available");
    expect(() =>
      insertRecurringOccurrence(
        note,
        { ...preview, occurrenceDay: "2026-11-08" },
        today,
      ),
    ).toThrow("no longer available");
  });

  test("materializes overnight occurrences using their starting date and full time range", () => {
    const preview = makePreview(
      "23:30 - 01:30 Focus 🔁 every day ⏳ 2026-11-06",
      "2026-11-08",
      { startTime: window.moment("2026-11-06 23:30") },
    );
    expect(
      insertRecurringOccurrence(
        `# Plan\n- [ ] ${preview.source.text}`,
        preview,
        today,
      ).split("\n")[1],
    ).toBe("- [ ] 23:30 - 01:30 Focus 🔁 every day ⏳ 2026-11-08");
  });
});
