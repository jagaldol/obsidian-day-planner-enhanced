import fs from "node:fs";

import { describe, expect, test } from "vitest";

const timeline = fs.readFileSync("src/ui/components/timeline.svelte", "utf8");
const needle = fs.readFileSync("src/ui/components/needle.svelte", "utf8");
const floatingControls = fs.readFileSync(
  "src/ui/components/floating-controls.svelte",
  "utf8",
);
const useFloatingUi = fs.readFileSync(
  "src/ui/hooks/use-floating-ui.ts",
  "utf8",
);
const timeBlockControls = fs.readFileSync(
  "src/ui/components/time-block-controls.svelte",
  "utf8",
);

describe("timeline visual contract", () => {
  test("renders one current-time needle across all visible columns", () => {
    expect(timeline.match(/<Needle\b/g)).toHaveLength(1);
    expect(timeline).toContain('<div class={["timeline", isInSidebar');
    expect(timeline).toContain("position: relative;");
    expect(timeline).toContain("isolation: isolate;");
  });

  test("keeps the current-time marker at the visible timeline edge", () => {
    expect(needle).not.toContain("--planner-ruler-width");
    expect(needle).toContain("z-index: 7;");
    expect(needle).toContain("left: 0;");
  });

  test("keeps selected sidebar blocks inside the clipping boundary", () => {
    expect(timeline).toContain("--timeline-time-block-inline-inset: 2px;");
    expect(timeline).toContain(
      "margin-inline: var(--timeline-time-block-inline-inset, 0);",
    );
  });

  test("keeps floating controls anchored to their block at boundaries", () => {
    expect(floatingControls.match(/shift\(/g)).toHaveLength(3);
    expect(floatingControls.match(/hide\(\)/g)).toHaveLength(3);
    expect(floatingControls.match(/padding: 0,/g)).toHaveLength(2);
    expect(floatingControls.match(/padding: floatingUiOffset,/g)).toHaveLength(
      1,
    );
    expect(floatingControls).toContain(
      "mainAxis: true,\n            crossAxis: true,",
    );
    expect(floatingControls).not.toContain('strategy: "fixed"');
    expect(floatingControls).toContain('placement: "top-start"');
    expect(floatingControls).toContain('placement: "top-end"');
    expect(floatingControls).toContain('placement: "bottom-start"');
    expect(useFloatingUi).toContain(
      "visibility: middlewareData.hide?.referenceHidden",
    );
    expect(timeBlockControls).not.toContain(
      '--expanding-controls-position="absolute"',
    );
  });
});
