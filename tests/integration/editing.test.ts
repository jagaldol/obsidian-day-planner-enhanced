import { Effect } from "effect";
import { isNotVoid } from "typed-assert";
import { describe, expect, test } from "vitest";

import type { EditableNestedListItem } from "../../src/service/list-item-entry-editor";
import { defaultSettingsForTests } from "../../src/settings";
import type { EditableTimeBlock } from "../../src/time-block-types";
import { EditMode } from "../../src/ui/hooks/use-edit/types";
import { getPathToDiff } from "../util/diff";

import { setUp } from "./util/setup";

function cloneNestedItems(
  items: EditableNestedListItem[] | undefined,
): EditableNestedListItem[] {
  return (items ?? []).map((item) => ({
    text: item.text,
    symbol: item.symbol,
    status: item.status,
    task: item.task,
    children: cloneNestedItems(item.children),
  }));
}

function replaceFirstLine(text: string, firstLine: string) {
  const [, ...rest] = text.split("\n");

  return [firstLine, ...rest].join("\n");
}

function toListItemLocation(task: EditableTimeBlock) {
  if (task.source === "unwritten") {
    throw new Error("Expected a persisted list item");
  }

  return { path: task.path, line: task.position.start.line };
}

describe("Editing", () => {
  describe("Daily notes", () => {
    test("Edits tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("List item under planner heading"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 17:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Writes 24:00 when a daily note task is moved to end at midnight", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("List item under planner heading"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 23:30"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-19.md": `
- - 11:00 - 11:30 List item under planner heading
+ - 23:30 - 24:00 List item under planner heading
`,
      });
    });

    test("Converts plain timed list items to all-day tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("List item under planner heading"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19"), "date");

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-19.md": `
- - 11:00 - 11:30 List item under planner heading
+ - [ ] List item under planner heading
`,
      });
    });

    test("Creates tasks", async () => {
      const { editContext, moveCursorTo, vault } = await setUp({
        visibleDays: ["2025-07-19", "2025-07-20"],
      });

      moveCursorTo(window.moment("2025-07-20 13:00"));
      editContext.handlers.handleContainerMouseDown();
      moveCursorTo(window.moment("2025-07-20 14:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Creates tasks at the clicked time without dragging", async () => {
      const { editContext, moveCursorTo, vault } = await setUp({
        visibleDays: ["2025-07-20"],
      });

      moveCursorTo(window.moment("2025-07-20 13:00"));
      editContext.handlers.handleContainerMouseDown();

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-20.md": [
          "",
          "+ # Day planner",
          "+ ",
          "+ - [ ] 13:00 - 13:30 Text input",
          "",
        ].join("\n"),
      });
    });

    test("Moves a parent task with its nested subtree between notes", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-28"],
        loadedFixtures: ["2025-07-28.md", "2025-07-19.md"],
        settings: {
          ...defaultSettingsForTests,
          sortTasksInPlanAfterEdit: true,
        },
      });

      editContext.handlers.handleGripMouseDown(
        findByText("Parent"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 10:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Removes a parent task with its nested subtree", async () => {
      const { taskEntryEditor, vault, findByText } = await setUp({
        visibleDays: ["2025-07-28"],
        loadedFixtures: ["2025-07-28.md"],
      });

      const location = toListItemLocation(findByText("Parent"));

      await Effect.runPromise(taskEntryEditor.removeAtLocation(location));

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-28.md": `
- - [ ] 09:00 - 10:00 Parent
-   Parent text
-     - [ ] Child task
-       Child text
-         - Child list item without time
`,
      });
    });

    test("Edits nested item text without changing the parent line", async () => {
      const { taskEntryEditor, vault, findByText } = await setUp({
        visibleDays: ["2025-07-28"],
        loadedFixtures: ["2025-07-28.md"],
      });

      const task = findByText("Parent");
      const location = toListItemLocation(task);

      const children = cloneNestedItems(task.children);
      const child = children[0];

      isNotVoid(child);

      child.text = replaceFirstLine(child.text, "Edited child task");

      await Effect.runPromise(
        taskEntryEditor.replaceNestedItemsAtLocation(location, children),
      );

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-28.md": `
-     - [ ] Child task
+     - [ ] Edited child task
`,
      });
    });

    test("Adds a root-level nested item", async () => {
      const { taskEntryEditor, vault, findByText } = await setUp({
        visibleDays: ["2025-07-28"],
        loadedFixtures: ["2025-07-28.md"],
      });

      const task = findByText("Parent");
      const location = toListItemLocation(task);

      const children = cloneNestedItems(task.children);

      children.push({ text: "Root child", symbol: "-" });

      await Effect.runPromise(
        taskEntryEditor.replaceNestedItemsAtLocation(location, children),
      );

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-28.md": `
+     - Root child
`,
      });
    });

    test("Adds a grandchild under a nested item", async () => {
      const { taskEntryEditor, vault, findByText } = await setUp({
        visibleDays: ["2025-07-28"],
        loadedFixtures: ["2025-07-28.md"],
      });

      const task = findByText("Parent");
      const location = toListItemLocation(task);

      const children = cloneNestedItems(task.children);
      const child = children[0];

      isNotVoid(child);

      child.children ??= [];
      child.children.push({ text: "Grandchild", symbol: "-" });

      await Effect.runPromise(
        taskEntryEditor.replaceNestedItemsAtLocation(location, children),
      );

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-28.md": `
+         - Grandchild
`,
      });
    });

    test("Deletes a nested item with its subtree", async () => {
      const { taskEntryEditor, vault, findByText } = await setUp({
        visibleDays: ["2025-07-28"],
        loadedFixtures: ["2025-07-28.md"],
      });

      const task = findByText("Parent");
      const location = toListItemLocation(task);

      await Effect.runPromise(
        taskEntryEditor.replaceNestedItemsAtLocation(location, []),
      );

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-28.md": `
-     - [ ] Child task
-       Child text
-         - Child list item without time
`,
      });
    });

    test("Preserves item text and time ranges when sibling order changes", async () => {
      const { taskEntryEditor, vault, findByText } = await setUp({
        visibleDays: ["2025-07-28"],
        loadedFixtures: ["2025-07-28.md"],
      });

      const task = findByText("Parent");
      const location = toListItemLocation(task);

      const children = cloneNestedItems(task.children);
      const child = children[0];

      isNotVoid(child);

      const reorderedChildren = [
        {
          text: "09:30 - 09:45 Sibling with time",
          symbol: "-",
          task: " ",
        },
        child,
      ];

      await Effect.runPromise(
        taskEntryEditor.replaceNestedItemsAtLocation(
          location,
          reorderedChildren,
        ),
      );

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-28.md": `
+     - [ ] 09:30 - 09:45 Sibling with time
`,
      });
    });

    test("Toggles nested items between plain bullets and checkbox tasks", async () => {
      const { taskEntryEditor, vault, findByText } = await setUp({
        visibleDays: ["2025-07-28"],
        loadedFixtures: ["2025-07-28.md"],
      });

      const task = findByText("Parent");
      const location = toListItemLocation(task);

      const children = cloneNestedItems(task.children);
      const child = children[0];
      const grandchild = child?.children?.[0];

      isNotVoid(grandchild);

      grandchild.task = " ";

      await Effect.runPromise(
        taskEntryEditor.replaceNestedItemsAtLocation(location, children),
      );

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-28.md": `
-         - Child list item without time
+         - [ ] Child list item without time
`,
      });
    });

    test("Adds the first nested item under a parent without children", async () => {
      const { taskEntryEditor, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
        loadedFixtures: ["2025-07-19.md"],
      });

      const task = findByText("List item under planner heading");
      const location = toListItemLocation(task);

      await Effect.runPromise(
        taskEntryEditor.replaceNestedItemsAtLocation(location, [
          { text: "First child", symbol: "-" },
        ]),
      );

      expect(getPathToDiff(vault.initialState, vault.state)).toEqual({
        "fixtures/fixture-vault/2025-07-19.md": `
+     - First child
`,
      });
    });

    test(`* Moves a nested task with text between notes
* Does not touch invalid markdown
* Undoes the move`, async () => {
      const {
        editContext,
        moveCursorTo,
        vault,
        findByText,
        transactionWriter,
      } = await setUp({
        visibleDays: ["2025-07-28"],
        settings: {
          ...defaultSettingsForTests,
          sortTasksInPlanAfterEdit: true,
        },
      });

      editContext.handlers.handleGripMouseDown(
        findByText("Child"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-20 17:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();

      await transactionWriter.undo();

      expect(
        Object.keys(getPathToDiff(vault.initialState, vault.state)).length,
      ).toBe(0);
    });
  });

  describe("Obsidian-tasks", () => {
    test("Schedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("Task without time"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 13:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Unschedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("Task with time"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19"), "date");

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Updates tasks plugin props without duplicating timestamps if moved to same time on another day", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
        loadedFixtures: ["tasks.md"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("Task with time"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-28 10:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });
  });

  describe("Dataview", () => {
    test.each([
      {
        variant: "brackets",
        label: "Task with Dataview `scheduled` prop in brackets",
      },
      {
        variant: "parens",
        label: "Task with Dataview `scheduled` prop in parens",
      },
    ])("Schedules tasks ($variant)", async ({ label }) => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText(label),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 13:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test.each([
      {
        variant: "brackets",
        label: "Task with timestamp and Dataview `scheduled` prop in brackets",
      },
      {
        variant: "parens",
        label: "Task with timestamp and Dataview `scheduled` prop in parens",
      },
    ])("Unschedules tasks ($variant)", async ({ label }) => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText(label),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19"), "date");

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });
  });
});
