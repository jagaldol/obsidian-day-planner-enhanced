import fs from "node:fs";
import path from "node:path";

import * as sass from "sass";
import { describe, expect, test } from "vitest";

const compiledCss = sass.compile(path.resolve("src/styles.scss"), {
  loadPaths: [path.resolve(".")],
  logger: sass.Logger.silent,
  style: "expanded",
}).css;

function declarationsFor(selector: string) {
  const matchingRules = [...compiledCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectorList]) =>
      selectorList
        .split(",")
        .map((candidate) => candidate.trim())
        .includes(selector),
    )
    .map(([, , declarations]) => declarations);

  expect(
    matchingRules,
    `Expected compiled CSS to contain ${selector}`,
  ).not.toHaveLength(0);

  const declarations = Object.fromEntries(
    matchingRules.flatMap((rule) =>
      [...rule.matchAll(/([\w-]+):\s*([^;]+);/g)].map(([, property, value]) => [
        property,
        value.trim(),
      ]),
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

  test("keeps collapsed controls intrinsic and bounds their expanded height", () => {
    expect(
      declarationsFor(".planner-timeline-layout > .planner-timeline-controls"),
    ).toMatchObject({
      flex: "0 0 auto",
      "max-height": "100%",
    });

    expect(
      declarationsFor(
        ".planner-timeline-layout > .planner-timeline-controls.settings-visible",
      ),
    ).toMatchObject({
      "flex-grow": "1",
      "flex-shrink": "1",
      "flex-basis": "0",
    });
  });

  test("assigns the timeline tree the remaining height explicitly", () => {
    expect(
      declarationsFor(".planner-timeline-layout > .planner-timeline-fill"),
    ).toMatchObject({
      "flex-grow": "1",
      "flex-shrink": "1",
      "flex-basis": "0",
      "max-height": "none",
    });
  });

  test("keeps all-day content intrinsic but shrinkable", () => {
    expect(
      declarationsFor(".planner-timeline-layout > .planner-timeline-all-day"),
    ).toMatchObject({
      flex: "0 1 auto",
      "max-height": "100%",
    });
  });

  test("keeps the nested timeline scroller bounded and scrollable", () => {
    expect(declarationsFor(".planner-timeline-scrollable")).toMatchObject({
      "flex-grow": "1",
      "flex-shrink": "1",
      "flex-basis": "0",
      "min-height": "0",
      overflow: "auto",
    });
  });

  test("wires the layout contract to the single-day view and timeline tree", () => {
    const timelineView = fs.readFileSync("src/ui/timeline-view.ts", "utf8");
    const timelineWithControls = fs.readFileSync(
      "src/ui/components/timeline-with-controls.svelte",
      "utf8",
    );

    expect(timelineView).toContain(
      'contentEl.addClass("planner-timeline-layout")',
    );
    expect(timelineWithControls).toContain('class="planner-timeline-all-day"');
    expect(timelineWithControls).toContain('class="planner-timeline-fill"');
    expect(timelineWithControls).toContain('"planner-timeline-scrollable"');
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
