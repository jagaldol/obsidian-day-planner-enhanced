import fs from "node:fs";
import path from "node:path";

import * as sass from "sass";
import { isNotVoid } from "typed-assert";
import { describe, expect, test } from "vitest";

const compiledCss = sass.compile(path.resolve("src/styles.scss"), {
  loadPaths: [path.resolve(".")],
  logger: sass.Logger.silent,
  style: "expanded",
}).css;

function declarationsFor(selector: string) {
  const matchingRules = [
    ...compiledCss.matchAll(/([^{}]+)\{([^{}]*)\}/g),
  ].flatMap((rule) => {
    const [, selectorList, declarations] = rule;

    isNotVoid(selectorList);
    isNotVoid(declarations);

    return selectorList
      .split(",")
      .map((candidate) => candidate.trim())
      .includes(selector)
      ? [declarations]
      : [];
  });

  expect(
    matchingRules,
    `Expected compiled CSS to contain ${selector}`,
  ).not.toHaveLength(0);

  const declarations = Object.fromEntries(
    matchingRules.flatMap((rule): [string, string][] =>
      [...rule.matchAll(/([\w-]+):\s*([^;]+);/g)].map((match) => {
        const [, property, value] = match;

        isNotVoid(property);
        isNotVoid(value);

        return [property, value.trim()];
      }),
    ),
  );

  return declarations;
}

describe("single-day timeline layout contract", () => {
  test("keeps every direct timeline child shrinkable", () => {
    expect(declarationsFor(".planner-timeline-layout > *")).toMatchObject({
      "min-height": "0",
    });
  });

  test("uses the upstream compact timeline grid", () => {
    expect(
      declarationsFor("[data-type=planner-timeline] .view-content"),
    ).toMatchObject({
      display: "grid",
      "grid-template-rows": "auto auto minmax(0, 1fr)",
      "grid-template-columns": "auto minmax(0, 1fr)",
    });
  });

  test("wires the compact rows to the single-day view", () => {
    const timelineView = fs.readFileSync("src/ui/timeline-view.ts", "utf8");
    const timelineWithControls = fs.readFileSync(
      "src/ui/components/timeline-with-controls.svelte",
      "utf8",
    );

    expect(timelineView).toContain(
      'contentEl.addClass("planner-timeline-layout")',
    );
    expect(timelineView).toContain("handleActiveFileChange(");
    expect(timelineView).toContain("this.app.workspace.getActiveFile()");
    expect(timelineWithControls).toContain('class="controls-row"');
    expect(timelineWithControls).toContain(
      'class={["all-day-row", $isInSidebar && "is-in-sidebar"]}',
    );
    expect(timelineWithControls).toContain('class="ruler"');
    expect(timelineWithControls).toContain('"timeline-row"');
    expect(timelineWithControls).toContain("max-height: 14.5vh");
    expect(timelineWithControls).not.toContain("max-height: max-content");
    expect(timelineWithControls).toContain("createResizeState({");
    expect(timelineWithControls).toContain(
      "getMaxHeight: () => allDayRowRef?.scrollHeight",
    );
    expect(timelineWithControls).toContain("bind:this={allDayRowRef}");
    expect(timelineWithControls).toContain("use:resizeAction");
    expect(timelineWithControls).toContain(
      ".all-day-row.is-in-sidebar {\n    margin-inline-start: -1px;",
    );
    expect(timelineWithControls).toContain("box-shadow: var(--shadow-bottom)");
    expect(timelineWithControls).not.toContain("box-sizing: content-box");
    expect(timelineWithControls).not.toContain(
      "var(--planner-all-day-shadow-space)",
    );
    expect(timelineWithControls).not.toContain("ResizeableBox");
    expect(timelineWithControls).not.toContain("createColumnSelectionMenu");
  });

  test("keeps the time tracker on its existing layout contract", () => {
    expect(declarationsFor(".planner-time-tracker-layout > *")).toMatchObject({
      flex: "1 1 0",
      "min-height": "0",
      "max-height": "max-content",
    });

    const timeTrackerView = fs.readFileSync(
      "src/ui/time-tracker-view.ts",
      "utf8",
    );

    expect(timeTrackerView).toContain(
      'contentEl.addClass("planner-time-tracker-layout")',
    );
  });
});
