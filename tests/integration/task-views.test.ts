import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { afterEach, describe, expect, test } from "vitest";

import { configureTimestampRegExps } from "../../src/regexp";
import { selectPlanTimeBlocksForDays } from "../../src/redux";
import { defaultSettingsForTests } from "../../src/settings";
import { isLocal } from "../../src/time-block-types";
import { toRenderableMarkdown } from "../../src/util/time-block-utils";

import { setUp } from "./util/setup";

afterEach(() => configureTimestampRegExps("HH:mm"));

describe("Task views", () => {
  test("Shows list item with checkbox, nested list items (tasks & plain list items) with their paragraphs and checkboxes", async () => {
    const { getState } = await setUp({
      loadedFixtures: ["2025-07-28.md"],
    });

    const planEntries = selectPlanTimeBlocksForDays(getState(), ["2025-07-28"]);
    const taskWithNestedListItems = planEntries.find((entry) =>
      entry.text.includes("Parent"),
    );

    isNotVoid(taskWithNestedListItems);

    const { listItem, nestedListItems } = toRenderableMarkdown(
      taskWithNestedListItems,
    );

    expect(listItem).toBe("- [ ] Parent");
    expect(nestedListItems).toBe(`- [ ] Child task
  Child text
\t- Child list item without time`);
  });

  test("Removes list tokens for plain list items", async () => {
    const { getState } = await setUp({
      loadedFixtures: ["2025-07-19.md"],
    });

    const planEntries = selectPlanTimeBlocksForDays(getState(), ["2025-07-19"]);
    const taskWithNestedListItems = planEntries.find((entry) =>
      entry.text.includes("List item under planner heading"),
    );

    isNotVoid(taskWithNestedListItems);

    const { listItem } = toRenderableMarkdown(taskWithNestedListItems);

    expect(listItem).toBe("List item under planner heading");
  });

  test("Wraps nested leading time ranges in code spans for rendering", () => {
    const { nestedListItems } = toRenderableMarkdown({
      text: "10:10 - 16:00 Conference block",
      symbol: "-",
      children: [
        {
          text: "10:20 - 11:00 Expo booth",
          symbol: "-",
          children: [
            {
              text: "Workshop demo",
              symbol: "-",
            },
          ],
        },
        {
          text: "Session notes",
          symbol: "-",
        },
        {
          text: "Workshop notes",
          symbol: "-",
          task: "x",
        },
      ],
    });

    expect(nestedListItems).toBe(`- \`10:20 - 11:00\` Expo booth
\t- Workshop demo

---

- Session notes
- [x] Workshop notes`);
  });

  test("Keeps leading tags in titles while formatting tagged time ranges", () => {
    const { listItem, nestedListItems } = toRenderableMarkdown({
      text: "#task/Highpriority 08:50 - 09:50 Fix the parser ⏳ 2026-07-26",
      symbol: "-",
      status: " ",
      children: [
        {
          text: "#work/project 09:00 - 09:15 Verify the fix",
          symbol: "-",
          status: " ",
        },
      ],
    });

    expect(listItem).toBe(
      "- [ ] #task/Highpriority Fix the parser ⏳ 2026-07-26",
    );
    expect(nestedListItems).toBe(
      "- [ ] #work/project `09:00 - 09:15` Verify the fix",
    );
  });

  test("Keeps leading tags in titles while formatting tagged single times", () => {
    const { listItem, nestedListItems } = toRenderableMarkdown({
      text: "#task/Flexible 10:00 TEST ⏳ 2026-07-27",
      symbol: "-",
      status: " ",
      children: [
        {
          text: "#work/project 10:15 Verify the fix",
          symbol: "-",
          status: " ",
        },
      ],
    });

    expect(listItem).toBe("- [ ] #task/Flexible TEST ⏳ 2026-07-27");
    expect(nestedListItems).toBe("- [ ] #work/project `10:15` Verify the fix");
  });

  test("Optionally hides Tasks metadata while preserving descriptions and tags", () => {
    const { listItem, nestedListItems } = toRenderableMarkdown(
      {
        text: "#task 10:00 - 11:00 Plan trip ⏳ 2026-07-27 📅 2026-08-07 🔁 every month when done",
        symbol: "-",
        status: " ",
        children: [
          {
            text: "Book hotel [scheduled:: 2026-07-27] [priority:: high]",
            symbol: "-",
            status: " ",
          },
          {
            text: "Call bank (due:: 2026-08-07) ✅ 2026-08-08",
            symbol: "-",
            status: "x",
          },
          {
            text: "Keep project context [owner:: Finance]",
            symbol: "-",
          },
        ],
      },
      { hideTasksMetadata: true },
    );

    expect(listItem).toBe("- [ ] #task Plan trip");
    expect(nestedListItems).toBe(`- [ ] Book hotel
- [x] Call bank
- Keep project context [owner:: Finance]`);
  });

  test("Hides all Tasks emoji metadata fields without changing source text", () => {
    const text =
      "10:00 - 11:00 Ship release 🔺 🆔 task-1 ⛔ task-0 🏁 keep ➕ 2026-07-01 🛫 2026-07-26 ⏳ 2026-07-27 📅 2026-07-28 ❌ 2026-07-29 ✅ 2026-07-30";
    const task = {
      text,
      symbol: "-",
      status: " ",
    };

    expect(
      toRenderableMarkdown(task, { hideTasksMetadata: true }).listItem,
    ).toBe("- [ ] Ship release");
    expect(task.text).toBe(text);
  });

  test("Downgrades embeds to links so they cannot push block text out of view", () => {
    const { listItem, nestedListItems } = toRenderableMarkdown({
      text: "09:00 - 10:00 Review ![[diagram.png]]",
      symbol: "-",
      status: " ",
      children: [
        { text: "Spec ![[brief.pdf]]", symbol: "-" },
        { text: "Bundle [[assets.zip]]", symbol: "-" },
        { text: "Shot ![alt](Attachments/shot.png)", symbol: "-" },
      ],
    });

    expect(listItem).toBe("- [ ] Review [[diagram.png]]");
    expect(nestedListItems).toBe(`- Spec [[brief.pdf]]
- Bundle [[assets.zip]]
- Shot [alt](Attachments/shot.png)`);
  });

  test("downgrades embeds in multiline parent and child content", () => {
    const { nestedListItems, paragraphs } = toRenderableMarkdown({
      text: "09:00 - 10:00 Review\n![[parent.png]]",
      symbol: "-",
      status: " ",
      children: [{ text: "Spec\n![[child.pdf]]", symbol: "-" }],
    });

    expect(paragraphs).toBe("[[parent.png]]");
    expect(nestedListItems).toBe(`- Spec
  [[child.pdf]]`);
  });

  test("does not rewrite embed-shaped text inside code spans", () => {
    const { listItem } = toRenderableMarkdown({
      text: "09:00 - 10:00 Keep `![[literal.png]]`, link ![[real.png]]",
      symbol: "-",
      status: " ",
    });

    expect(listItem).toBe("- [ ] Keep `![[literal.png]]`, link [[real.png]]");
  });

  test("does not treat an unmatched backtick as a code span", () => {
    const { listItem } = toRenderableMarkdown({
      text: "09:00 - 10:00 Typo ` then ![[real.png]]",
      symbol: "-",
      status: " ",
    });

    expect(listItem).toBe("- [ ] Typo ` then [[real.png]]");
  });

  test("Keeps embeds when showEmbedsInTaskBlocks is on", () => {
    const { listItem, nestedListItems } = toRenderableMarkdown(
      {
        text: "09:00 - 10:00 Review ![[diagram.png]]",
        symbol: "-",
        status: " ",
        children: [{ text: "Spec ![[brief.pdf]]", symbol: "-" }],
      },
      { showEmbedsInTaskBlocks: true },
    );

    expect(listItem).toBe("- [ ] Review ![[diagram.png]]");
    expect(nestedListItems).toBe("- Spec ![[brief.pdf]]");
  });

  test("Leaves an escaped exclamation mark alone", () => {
    const { listItem } = toRenderableMarkdown({
      text: String.raw`09:00 - 10:00 Wow\![[note]]`,
      symbol: "-",
      status: " ",
    });

    expect(listItem).toBe(String.raw`- [ ] Wow\![[note]]`);
  });

  test("treats an exclamation mark after two backslashes as unescaped", () => {
    const { listItem } = toRenderableMarkdown({
      text: String.raw`09:00 - 10:00 Wow\\![[note]]`,
      symbol: "-",
      status: " ",
    });

    expect(listItem).toBe(String.raw`- [ ] Wow\\[[note]]`);
  });

  test("Preserves numeric-leading text when rendering with HH:mm", () => {
    const { listItem, nestedListItems } = toRenderableMarkdown({
      text: "2026 goals",
      symbol: "-",
      children: [{ text: "2026 milestones", symbol: "-" }],
    });

    expect(listItem).toBe("2026 goals");
    expect(nestedListItems).toBe("- 2026 milestones");
  });

  test("Formats compact ranges when rendering with HHmm", () => {
    configureTimestampRegExps("HHmm");

    const { listItem, nestedListItems } = toRenderableMarkdown({
      text: "0700 - 0840 Exercise",
      symbol: "-",
      children: [{ text: "0710 - 0720 Warm-up", symbol: "-" }],
    });

    expect(listItem).toBe("Exercise");
    expect(nestedListItems).toBe("- `0710 - 0720` Warm-up");
  });

  test("Formats compact single times only after leading tags with HHmm", () => {
    configureTimestampRegExps("HHmm");

    const tagged = toRenderableMarkdown({
      text: "#task/Flexible 1000 TEST",
      symbol: "-",
      status: " ",
      children: [
        { text: "#work/project 1015 Verify the fix", symbol: "-" },
        { text: "1100 Direct compact note", symbol: "-" },
      ],
    });
    const direct = toRenderableMarkdown({
      text: "1000 Direct compact task",
      symbol: "-",
      status: " ",
    });

    expect(tagged.listItem).toBe("- [ ] #task/Flexible TEST");
    expect(tagged.nestedListItems).toBe(
      "- #work/project `1015` Verify the fix\n\n---\n\n- 1100 Direct compact note",
    );
    expect(direct.listItem).toBe("- [ ] 1000 Direct compact task");
  });

  test("Preserves a completed task title starting with 0700 after an HHmm range", () => {
    configureTimestampRegExps("HHmm");

    const { listItem } = toRenderableMarkdown({
      text: "0700 - 0840 0700 tasks completed",
      symbol: "-",
      status: "x",
    });

    expect(listItem).toBe("- [x] 0700 tasks completed");
  });

  test("Adds dividers at every timed and untimed child boundary without reordering", () => {
    const { nestedListItems } = toRenderableMarkdown({
      text: "10:00 - 13:00 Deep work",
      symbol: "-",
      children: [
        {
          text: "First untimed task",
          symbol: "-",
        },
        {
          text: "10:30 - 11:30 First timed task",
          symbol: "-",
        },
        {
          text: "Second untimed task",
          symbol: "-",
        },
        {
          text: "12:00 - 12:30 Second timed task",
          symbol: "-",
        },
        {
          text: "12:30 - 13:00 Third timed task",
          symbol: "-",
        },
        {
          text: "Final untimed task",
          symbol: "-",
        },
      ],
    });

    expect(nestedListItems).toBe(`- First untimed task

---

- \`10:30 - 11:30\` First timed task

---

- Second untimed task

---

- \`12:00 - 12:30\` Second timed task
- \`12:30 - 13:00\` Third timed task

---

- Final untimed task`);
  });

  test.todo("Does not show code blocks in rendered markdown");

  test("With empty plannerHeading, indexes tasks outside the planner section", async () => {
    const { getState } = await setUp({
      visibleDays: ["2025-07-19"],
      settings: {
        ...defaultSettingsForTests,
        plannerHeading: "",
      },
    });

    expect(
      selectPlanTimeBlocksForDays(getState(), ["2025-07-19"]),
    ).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task outside of planner heading"),
      }),
    );
  });

  test("Ignores tasks and lists outside of planner section in daily notes", async () => {
    const { editContext } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    const displayedTimeBlocks = editContext.getDisplayedTimeBlocksForTimeline(
      window.moment("2025-07-19"),
    );

    expect(get(displayedTimeBlocks)?.noTime).not.toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task outside of planner heading"),
      }),
    );
  });

  test("Combines tasks from daily notes with tasks from other files", async () => {
    const { editContext } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    const displayedTimeBlocks = editContext.getDisplayedTimeBlocksForTimeline(
      window.moment("2025-07-19"),
    );

    const { withTime, noTime } = get(displayedTimeBlocks);

    expect(withTime).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("List item under planner heading"),
      }),
    );
    expect(withTime).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task with time"),
      }),
    );

    expect(noTime).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task without time"),
      }),
    );
  });

  test("Shows a daily-note overnight plan on the next day's timeline", async () => {
    const { editContext } = await setUp({
      loadedFixtures: ["2025-07-21.md"],
      visibleDays: ["2025-07-22"],
    });

    const displayedTimeBlocks = editContext.getDisplayedTimeBlocksForTimeline(
      window.moment("2025-07-22"),
    );

    expect(get(displayedTimeBlocks).withTime).toContainEqual(
      expect.objectContaining({
        text: "23:00 - 00:30 Reading a Book",
        startTime: window.moment("2025-07-22 00:00"),
        durationMinutes: 30,
        timelineSegment: expect.objectContaining({
          sourceStartTime: window.moment("2025-07-21 23:00"),
          sourceDurationMinutes: 90,
          startsBeforeSegment: true,
          continuesAfterSegment: false,
        }),
      }),
    );
  });

  test.each([
    [
      {
        description: "Shows completed tasks",
        showCompletedTasks: true,
        expectedLength: 1,
      },
    ],
    [
      {
        description: "Removes completed tasks",
        showCompletedTasks: false,
        expectedLength: 0,
      },
    ],
  ])("$description", async ({ expectedLength, showCompletedTasks }) => {
    const { editContext } = await setUp({
      loadedFixtures: ["tasks.md"],
      visibleDays: ["2025-07-19"],
      settings: {
        ...defaultSettingsForTests,
        showCompletedTasks,
      },
    });

    const displayedTimeBlocks = editContext.getDisplayedTimeBlocksForTimeline(
      window.moment("2025-07-19"),
    );

    const { noTime } = get(displayedTimeBlocks);

    expect(
      noTime.filter(
        (it) => isLocal(it) && it.text.includes("Task without time"),
      ),
    ).toHaveLength(expectedLength);
  });
});
