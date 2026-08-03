import fs from "node:fs";

import { describe, expect, test } from "vitest";

const timeline = fs.readFileSync("src/ui/components/timeline.svelte", "utf8");
const timelineWithControls = fs.readFileSync(
  "src/ui/components/timeline-with-controls.svelte",
  "utf8",
);
const timelineSettingsModal = fs.readFileSync(
  "src/ui/timeline-settings-modal.ts",
  "utf8",
);
const settingsControls = fs.readFileSync(
  "src/ui/components/settings-controls.svelte",
  "utf8",
);
const ruler = fs.readFileSync("src/ui/components/ruler.svelte", "utf8");
const needle = fs.readFileSync("src/ui/components/needle.svelte", "utf8");
const floatingControls = fs.readFileSync(
  "src/ui/components/floating-controls.svelte",
  "utf8",
);
const resizeControls = fs.readFileSync(
  "src/ui/components/resize-controls.svelte",
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
const timeBlockBase = fs.readFileSync(
  "src/ui/components/time-block-base.svelte",
  "utf8",
);
const renderedMarkdown = fs.readFileSync(
  "src/ui/components/rendered-markdown.svelte",
  "utf8",
);
const unscheduledTimeBlock = fs.readFileSync(
  "src/ui/components/unscheduled-time-block.svelte",
  "utf8",
);
const multiDayRow = fs.readFileSync(
  "src/ui/components/multi-day/multi-day-row.svelte",
  "utf8",
);
const multiDayGrid = fs.readFileSync(
  "src/ui/components/multi-day/multi-day-grid.svelte",
  "utf8",
);
const columnTracksOverlay = fs.readFileSync(
  "src/ui/components/multi-day/column-tracks-overlay.svelte",
  "utf8",
);
const scroller = fs.readFileSync("src/ui/components/scroller.svelte", "utf8");

describe("timeline visual contract", () => {
  test("renders one current-time needle across all visible columns", () => {
    expect(timeline.match(/<Needle\b/g)).toHaveLength(1);
    expect(timeline).toContain('<div class={["timeline", isInSidebar');
    expect(timeline).toContain("position: relative;");
    expect(timeline).toContain("isolation: isolate;");
  });

  test("renders the current-time line behind timeline blocks", () => {
    expect(needle).toContain("z-index: 1;");
    expect(timeline).toContain(".tasks {");
    expect(timeline).toContain("z-index: 2;");
    expect(timeline).not.toContain("--timeline-column-z-index=");
  });

  test("keeps short time-block headers readable with long task titles", () => {
    expect(renderedMarkdown).toContain("const compactMaxHeightPx = 20;");
    expect(renderedMarkdown).toContain(
      "!timeBlock.isAllDayEvent && blockHeightPx <= compactMaxHeightPx",
    );
    expect(renderedMarkdown).toContain("const stackedHeaderBaseHeightPx = 40;");
    expect(renderedMarkdown).toContain(
      "stackedHeaderBaseHeightPx + nestedItemsRequiredHeightPx",
    );
    expect(renderedMarkdown).toContain(
      '? "var(--rendered-markdown-compact-padding, 3px 11px)"',
    );
    expect(renderedMarkdown).toContain(
      ': "var(--rendered-markdown-timed-padding, 6px 11px 5px)"',
    );
    expect(renderedMarkdown).toMatch(
      /\.time-summary-row\s*\{[^}]*--time-summary-line-height:\s*1\.25;[^}]*gap:\s*4px;[^}]*align-items:\s*flex-start;/,
    );
    expect(renderedMarkdown).toMatch(
      /\.time-block-range\s*\{[^}]*flex:\s*0 0 auto;[^}]*line-height:\s*var\(--time-summary-line-height\);/,
    );
    expect(renderedMarkdown).toMatch(
      /\.first-line-wrapper\s*\{[^}]*line-height:\s*var\(--time-summary-line-height\);/,
    );
    expect(renderedMarkdown).toMatch(
      /\.first-line-wrapper :global\(p\)\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;/,
    );
    expect(renderedMarkdown).toMatch(
      /\.first-line-wrapper :global\(p\),\s*\.first-line-wrapper :global\(li\)\s*\{[^}]*white-space:\s*nowrap;/,
    );
    expect(renderedMarkdown).not.toMatch(
      /\.first-line-wrapper :global\(li\)\s*\{[^}]*overflow:\s*hidden;/,
    );
    expect(renderedMarkdown).toMatch(
      /\.first-line-wrapper\.is-stacked-header :global\(p\),\s*\.first-line-wrapper\.is-stacked-header :global\(li\)\s*\{[^}]*white-space:\s*normal;/,
    );
    expect(renderedMarkdown).toMatch(
      /\.time-summary-row\.is-compact\s*\{[^}]*gap:\s*4px;[^}]*align-items:\s*flex-start;/,
    );
    expect(renderedMarkdown).not.toMatch(
      /\.time-summary-row\.is-compact[^}]*line-height:\s*1\.2;/,
    );
  });

  test("starts the single-day current-time marker at the ruler edge", () => {
    expect(timelineWithControls).toContain(
      "showCurrentTimeMarker={$isToday(firstDayInRange)}",
    );
    expect(timelineWithControls).toContain("showNeedleMarker={false}");
    expect(ruler).toContain('class="ruler-needle-line"');
    expect(ruler).toContain("left: 0;");
    expect(ruler).toContain("right: -1px;");
    expect(needle).toContain('showMarker && "show-marker"');
  });

  test("keeps the multi-day marker in the ruler and the line on today only", () => {
    expect(multiDayGrid).toContain(
      "showCurrentTimeMarker={dateRange.current.some($isToday)}",
    );
    expect(multiDayGrid).toContain("showNeedleMarker={false}");
    expect(timeline).toContain("{#if $isToday(day)}");
  });

  test("starts all-day rows at 16vh and lets resizing reach content height", () => {
    expect(timelineWithControls).toContain("createResizeState({");
    expect(timelineWithControls).toContain("<GripHorizontal");
    expect(timelineWithControls).toContain("use:resizeAction");
    expect(timelineWithControls).toContain("max-height: 16vh;");
    expect(timelineWithControls).toContain(
      "getMaxHeight: () => allDayRowRef?.scrollHeight",
    );
    expect(timelineWithControls).toContain("bind:this={allDayRowRef}");
    expect(multiDayGrid).toContain("createResizeState({");
    expect(multiDayGrid).toContain(
      "getMaxHeight: () => multiDayContentRef?.scrollHeight",
    );
    expect(multiDayGrid).toContain(
      "<MultiDayRow bind:el={multiDayContentRef} />",
    );
    expect(multiDayGrid).toContain("max-height: 16vh;");
  });

  test("exposes the first day of week in timeline settings", () => {
    for (const settingsSurface of [timelineSettingsModal, settingsControls]) {
      expect(settingsSurface).toContain('setName("First day of week")');
      expect(settingsSurface).toContain("firstDayOfWeekOptions");
      expect(settingsSurface).toContain("firstDayOfWeek: value");
    }
  });

  test("shares the 1-5 timeline zoom options across settings surfaces", () => {
    for (const settingsSurface of [timelineSettingsModal, settingsControls]) {
      expect(settingsSurface).toContain("timelineZoomLevelOptions");
      expect(settingsSurface).not.toContain("Array.range(1, 8)");
      expect(settingsSurface).not.toContain("range(1, 9)");
    }
  });

  test("exposes display-focused Enhanced shortcuts in timeline settings", () => {
    expect(timelineSettingsModal).toContain('.setHeading("Enhanced features")');
    expect(timelineSettingsModal).toContain("hideTasksMetadata");
    expect(timelineSettingsModal).toContain("hideTimeRangeInSingleLine");
    expect(timelineSettingsModal).not.toContain("enableTimeTracker");
  });

  test("always renders all-day rows and the sidebar timeline", () => {
    for (const source of [
      timelineWithControls,
      multiDayGrid,
      timelineSettingsModal,
      settingsControls,
    ]) {
      expect(source).not.toContain("showUncheduledTasks");
      expect(source).not.toContain("showTimelineInSidebar");
    }

    expect(timelineWithControls).toContain(
      'class={["all-day-row", $isInSidebar && "is-in-sidebar"]}',
    );
    expect(timelineWithControls).toContain("isInSidebar={$isInSidebar}");
    expect(multiDayGrid).toContain(
      'class={["planner-header-row", "horizontal-resize-box-wrapper"]}',
    );
  });

  test("overlaps the sidebar border while preserving right clipping space", () => {
    expect(timeline).toContain(
      "--timeline-time-block-inline-start-overlap: -1px;",
    );
    expect(timeline).toContain("--timeline-time-block-inline-end-inset: 2px;");
    expect(timeline).toContain(
      "margin-inline: var(--timeline-time-block-inline-start-overlap, 0)",
    );
    expect(timeline).toContain(
      "var(--timeline-time-block-inline-end-inset, 0);",
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

  test("starts resize gestures relative to the selected block edge", () => {
    expect(resizeControls).toContain("getResizeStartState");
    expect(resizeControls).toContain("getRelativePointerDateTime");
    expect(resizeControls).toContain("getIsomorphicClientY(event)");
    expect(resizeControls).toContain("onpanstart: prepareResize");
    expect(resizeControls).toContain("onpanmove: (event)");
    expect(resizeControls).not.toContain("onpanstart: (event) => startResize");
  });

  test("renders all-day blocks as compact calendar-colored list rows", () => {
    expect(unscheduledTimeBlock).toContain(
      "const isAllDayList = $derived(timeBlock.isAllDayEvent === true)",
    );
    expect(unscheduledTimeBlock).toContain("allDayList={isAllDayList}");
    expect(unscheduledTimeBlock).toContain("{allDayColor}");
    expect(unscheduledTimeBlock).toContain(
      '"var(--planner-all-day-color, var(--color-blue))"',
    );
    expect(unscheduledTimeBlock).toContain("timeBlock.calendar.color");
    expect(timeBlockBase).toContain('allDayList && "all-day-list"');
    expect(timeBlockBase).toContain(".content.all-day-list");
    expect(timeBlockBase).toContain(
      "background-color: var(--time-block-bg-color, var(--background-primary));",
    );
    expect(timeBlockBase).toContain(
      "border-width: 0 var(--all-day-list-border-right-width, 0) 1px 0;",
    );
    for (const allDaySurface of [timelineWithControls, multiDayRow]) {
      expect(allDaySurface).toContain(
        '--all-day-list-border-right-width="1px"',
      );
    }
    expect(timelineWithControls).toContain('--block-list-padding="0"');
  });

  test("aligns multi-day headers and all-day tracks to the real scrollbar gutter", () => {
    expect(scroller).toContain("el = $bindable()");
    expect(multiDayGrid).toContain("bind:el={timelineScrollerRef}");
    expect(multiDayGrid).toContain("el.offsetWidth - el.clientWidth");
    expect(multiDayGrid).toContain("--multi-day-scrollbar-gutter");
    expect(columnTracksOverlay).toContain(
      "var(--multi-day-scrollbar-gutter, 0)",
    );
    expect(multiDayRow).not.toContain("var(--scrollbar-width)");
    expect(multiDayGrid).toContain(
      "if (!multiDayRowRef || !columnTrackOverlayEl)",
    );
    expect(multiDayGrid).toContain(
      "const containerWidth = columnTrackOverlayEl.scrollWidth;",
    );
  });
});
