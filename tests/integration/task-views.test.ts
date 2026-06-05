import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { describe, expect, test } from "vitest";

import { selectPlanEntriesForDays } from "../../src/redux";
import { defaultSettingsForTests } from "../../src/settings";
import { isLocal } from "../../src/task-types";
import { toRenderableMarkdown } from "../../src/util/task-utils";

import { setUp } from "./util/setup";

describe("Task views", () => {
  test("Shows list item with checkbox, nested list items (tasks & plain list items) with their paragraphs and checkboxes", async () => {
    const { getState } = await setUp({
      loadedFixtures: ["2025-07-28.md"],
    });

    const planEntries = selectPlanEntriesForDays(getState(), ["2025-07-28"]);
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

    const planEntries = selectPlanEntriesForDays(getState(), ["2025-07-19"]);
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

    expect(selectPlanEntriesForDays(getState(), ["2025-07-19"])).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task outside of planner heading"),
      }),
    );
  });

  test("Ignores tasks and lists outside of planner section in daily notes", async () => {
    const { editContext } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    const displayedTasks = editContext.getDisplayedTasksForTimeline(
      window.moment("2025-07-19"),
    );

    expect(get(displayedTasks)?.noTime).not.toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task outside of planner heading"),
      }),
    );
  });

  test("Combines tasks from daily notes with tasks from other files", async () => {
    const { editContext } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    const displayedTasks = editContext.getDisplayedTasksForTimeline(
      window.moment("2025-07-19"),
    );

    const { withTime, noTime } = get(displayedTasks);

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

    const displayedTasks = editContext.getDisplayedTasksForTimeline(
      window.moment("2025-07-19"),
    );

    const { noTime } = get(displayedTasks);

    expect(
      noTime.filter(
        (it) => isLocal(it) && it.text.includes("Task without time"),
      ),
    ).toHaveLength(expectedLength);
  });
});
