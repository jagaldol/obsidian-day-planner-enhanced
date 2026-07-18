<script lang="ts">
  import type { Snippet } from "svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import {
    isListItemSourced,
    type LocalTimeBlock,
  } from "../../time-block-types";
  import { createRenderMarkdownAttachment } from "../../util/dom";
  import { getMinutesSinceMidnight } from "../../util/moment";
  import {
    createTimestampParts,
    isCompleted,
    toRenderableMarkdown,
  } from "../../util/time-block-utils";

  import TimeBlockContentLayout from "./time-block-content-layout.svelte";

  const {
    task,
    bottomDecoration,
  }: { task: LocalTimeBlock; bottomDecoration?: Snippet } = $props();

  const { renderMarkdown, toggleCheckboxInFile, settings } =
    getObsidianContext();

  type NestedListItem = NonNullable<LocalTimeBlock["children"]>[number];

  const onCheckboxLineClick = $derived(
    isListItemSourced(task)
      ? (line: number) => toggleCheckboxInFile(task.path, line)
      : undefined,
  );

  const { listItem, nestedListItems } = $derived(toRenderableMarkdown(task));

  const timeRange = $derived.by(() => {
    if (task.isAllDayEvent) {
      return undefined;
    }

    const sourceStartTime =
      task.timelineSegment?.sourceStartTime ?? task.startTime;
    const sourceDurationMinutes =
      task.timelineSegment?.sourceDurationMinutes ?? task.durationMinutes;
    const timeParts = createTimestampParts(
      getMinutesSinceMidnight(sourceStartTime),
      sourceDurationMinutes,
      $settings.timestampFormat,
    );

    return {
      end: timeParts.end,
      highlightEnd: task.timelineSegment?.continuesAfterSegment === true,
      highlightStart: task.timelineSegment?.startsBeforeSegment === true,
      start: timeParts.start,
    };
  });

  const compactThresholdMinutes = $derived(
    $settings.zoomLevel <= 2
      ? 80 / 2 ** $settings.zoomLevel
      : $settings.zoomLevel <= 4
        ? 10
        : 0,
  );
  const isCompact = $derived(
    !task.isAllDayEvent && task.durationMinutes <= compactThresholdMinutes,
  );

  function flatten(entries: NestedListItem[] = []): NestedListItem[] {
    return entries.flatMap((child) => [
      child,
      ...flatten(child.children ?? []),
    ]);
  }

  const nestedItems = $derived(
    $settings.showSubtasksInTaskBlocks ? flatten(task.children ?? []) : [],
  );
  const nestedItemCount = $derived(nestedItems.length);
  const blockHeightPx = $derived(
    task.isAllDayEvent ? 0 : task.durationMinutes * $settings.zoomLevel,
  );

  // Keep the header on one line when a stacked header would crowd nested items.
  const stackedHeaderBaseHeightPx = 58;
  const nestedItemEstimatedLineHeightPx = 22;
  const stackedHeaderRequiredHeightPx = $derived(
    stackedHeaderBaseHeightPx +
      nestedItemCount * nestedItemEstimatedLineHeightPx,
  );
  const useStackedHeader = $derived(
    !isCompact && blockHeightPx >= stackedHeaderRequiredHeightPx,
  );

  const completed = $derived(isCompleted(task.task ?? task.status));
  const listItemLine = $derived(
    isListItemSourced(task) ? task.position.start.line : undefined,
  );
  const nestedListItemLines = $derived(
    nestedItems
      .filter((nestedItem) => nestedItem.task !== undefined)
      .map((nestedItem) => nestedItem.position.start.line),
  );
</script>

<TimeBlockContentLayout
  --time-block-content-layout-gap="var(--rendered-markdown-gap)"
  --time-block-content-layout-padding={isCompact
    ? "3px 11px"
    : "var(--rendered-markdown-padding, 9px 11px 7px)"}
  class="rendered-markdown planner-sticky-block-content"
  {bottomDecoration}
  {completed}
>
  {#snippet title()}
    <div
      class={[
        "time-summary-row",
        isCompact && "is-compact",
        useStackedHeader && "is-stacked-header",
      ]}
    >
      {#if timeRange}
        <div
          class={[
            "time-block-range",
            (timeRange.highlightStart || timeRange.highlightEnd) &&
              "has-other-day-time",
          ]}
        >
          <span
            class={[
              "time-block-time",
              timeRange.highlightStart && "is-other-day",
            ]}>{timeRange.start}</span
          >
          <span class="time-block-separator"> - </span>
          <span
            class={[
              "time-block-time",
              timeRange.highlightEnd && "is-other-day",
            ]}>{timeRange.end}</span
          >
        </div>
      {/if}

      <div
        class={[
          "markdown-wrapper",
          "first-line-wrapper",
          completed && "is-completed",
          isCompact && "is-compact",
          useStackedHeader && "is-stacked-header",
        ]}
        {@attach createRenderMarkdownAttachment({
          renderMarkdown,
          markdown: listItem,
          taskLines: [listItemLine],
          onCheckboxLineClick,
        })}
      ></div>
    </div>
  {/snippet}

  {#snippet contents()}
    {#if $settings.showSubtasksInTaskBlocks && nestedListItems}
      <div
        class={[
          "markdown-wrapper",
          "lines-after-first-wrapper",
          useStackedHeader && "is-stacked-header",
        ]}
        {@attach createRenderMarkdownAttachment({
          renderMarkdown,
          markdown: nestedListItems,
          taskLines: nestedListItemLines,
          onCheckboxLineClick,
        })}
      ></div>
    {/if}
  {/snippet}
</TimeBlockContentLayout>

<style>
  .markdown-wrapper {
    --checkbox-size: var(--planner-time-block-font-size, var(--font-ui-small));
    --checklist-done-color: var(--text-faint);
    --checkbox-border-color: var(--text-faint);

    min-width: 0;
  }

  :global(.is-mobile) .markdown-wrapper {
    --checkbox-size: var(
      --planner-time-block-font-size,
      var(--font-ui-smaller)
    );
  }

  .time-summary-row {
    display: flex;
    gap: 8px;
    align-items: baseline;
    min-width: 0;
  }

  .markdown-wrapper :global(p),
  .markdown-wrapper :global(ul) {
    margin-block: 0;
  }

  .markdown-wrapper :global(ul),
  .markdown-wrapper :global(ol) {
    padding-inline-start: var(--size-4-5);
  }

  .markdown-wrapper :global(input[type="checkbox"]) {
    top: var(--size-2-1);
    margin-inline-end: var(--size-4-1);
    border-color: var(--checkbox-border-color);
  }

  .markdown-wrapper :global(li) {
    color: var(--text-muted);
  }

  .markdown-wrapper :global(li.task-list-item[data-task="x"]),
  .markdown-wrapper :global(li.task-list-item[data-task="X"]) {
    color: var(--checklist-done-color, var(--text-faint));
  }

  .time-block-range {
    overflow: hidden;
    display: inline-flex;
    flex: 0 1 auto;
    align-items: baseline;

    min-width: 0;
    margin-block-end: 0;

    font-size: 0.86em;
    font-weight: var(--font-medium);
    font-variant-numeric: tabular-nums;
    line-height: 1.25;
    color: var(--text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .time-block-time {
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
  }

  .time-block-time.is-other-day {
    font-weight: var(--font-semibold);
    color: color-mix(in srgb, var(--interactive-accent) 72%, var(--text-muted));
  }

  .time-block-separator {
    flex: 0 0 auto;
  }

  .first-line-wrapper {
    overflow: hidden;
    flex: 1 1 auto;

    font-weight: var(
      --planner-time-block-summary-font-weight,
      var(--font-semibold)
    );
    line-height: 1.28;
    color: var(--planner-time-block-summary-color, var(--text-normal));
  }

  .first-line-wrapper :global(p) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .first-line-wrapper.is-completed {
    --planner-time-block-summary-color: var(
      --checklist-done-color,
      var(--text-faint)
    );
  }

  .time-summary-row.is-stacked-header {
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
  }

  .first-line-wrapper.is-stacked-header {
    width: 100%;
  }

  .first-line-wrapper.is-stacked-header :global(p) {
    white-space: normal;
  }

  .lines-after-first-wrapper {
    --nested-timeline-color: var(--time-block-strip-color, var(--color-accent));

    overflow: visible;
    min-width: 0;
    margin-block-start: 4px;
    padding-inline-start: 8px;
  }

  .lines-after-first-wrapper.is-stacked-header {
    margin-block-start: 6px;
  }

  .lines-after-first-wrapper :global(ul),
  .lines-after-first-wrapper :global(ol) {
    --nested-list-gap: 4px;
    --timed-dot-size: 5px;
    --timed-dot-top: 0.6em;
    --timed-dot-center: calc(var(--timed-dot-top) + var(--timed-dot-size) / 2);
    --timeline-axis-x: 0.5px;

    position: relative;

    display: flex;
    flex-direction: column;
    gap: var(--nested-list-gap);

    margin-block: 0;
    padding-inline-start: 0;

    list-style: none;
  }

  .lines-after-first-wrapper :global(ul > li) {
    --nested-item-indent: 14px;

    position: relative;
    min-width: 0;
    padding-inline-start: var(--nested-item-indent);
  }

  .lines-after-first-wrapper :global(ul > li::before) {
    content: "";

    position: absolute;
    top: 0.64em;
    left: var(--timeline-axis-x);
    transform: translateX(-50%);

    width: 4px;
    height: 4px;

    background: var(--nested-timeline-color);
    border-radius: 999px;
  }

  .lines-after-first-wrapper :global(ul > li:has(> code)::before),
  .lines-after-first-wrapper :global(ul > li:has(> p > code)::before) {
    z-index: 1;
    top: var(--timed-dot-top);
    left: var(--timeline-axis-x);
    transform: translateX(-50%);

    width: var(--timed-dot-size);
    height: var(--timed-dot-size);

    background: var(--nested-timeline-color);
    border-radius: 999px;
  }

  .lines-after-first-wrapper
    :global(ul > li:has(> code):has(~ li > code)::after),
  .lines-after-first-wrapper
    :global(ul > li:has(> code):has(~ li > p > code)::after),
  .lines-after-first-wrapper
    :global(ul > li:has(> p > code):has(~ li > code)::after),
  .lines-after-first-wrapper
    :global(ul > li:has(> p > code):has(~ li > p > code)::after) {
    content: "";

    position: absolute;
    z-index: 0;
    top: var(--timed-dot-center);
    bottom: calc(-1 * (var(--nested-list-gap) + var(--timed-dot-center)));
    left: var(--timeline-axis-x);
    transform: translateX(-50%);

    width: 1px;

    background: color-mix(
      in srgb,
      var(--nested-timeline-color) 42%,
      transparent
    );
  }

  .lines-after-first-wrapper :global(li) {
    min-width: 0;
    line-height: 1.34;
    color: var(--text-muted);
  }

  .lines-after-first-wrapper :global(li:has(> code)),
  .lines-after-first-wrapper :global(li:has(> p > code)) {
    font-weight: var(--font-medium);
  }

  .lines-after-first-wrapper :global(li > p) {
    margin-block: 0;
  }

  .lines-after-first-wrapper :global(li code) {
    display: inline-block;

    min-width: 6.5em;
    margin-inline-end: 8px;
    padding: 0;

    font-family: inherit;
    font-size: 0.86em;
    font-weight: var(--font-normal);
    font-variant-numeric: tabular-nums;
    line-height: 1.25;
    color: var(--text-muted);
    white-space: nowrap;

    background: transparent;
  }

  .lines-after-first-wrapper :global(ul ul) {
    gap: 2px;
    margin-block-start: 4px;
    padding-inline-start: 8px;
  }

  .lines-after-first-wrapper :global(ul ul > li) {
    padding-inline-start: var(--nested-item-indent);
    font-size: 0.95em;
  }

  .lines-after-first-wrapper :global(ul ul > li::before) {
    content: "";

    position: absolute;
    top: 0.62em;
    left: 1px;

    width: 4px;
    height: 4px;

    background: var(--nested-timeline-color);
    border-radius: 999px;
  }

  .lines-after-first-wrapper :global(hr) {
    height: 1px;
    margin: 9px 0 7px;
    background: repeating-linear-gradient(
      to right,
      color-mix(in srgb, var(--nested-timeline-color) 34%, transparent),
      color-mix(in srgb, var(--nested-timeline-color) 34%, transparent) 4px,
      transparent 4px,
      transparent 8px
    );
    border: 0;
  }

  .lines-after-first-wrapper :global(li.task-list-item input[type="checkbox"]) {
    margin-inline-start: 0;
  }

  .lines-after-first-wrapper
    :global(li.task-list-item input[type="checkbox"]:checked) {
    background-color: var(--checkbox-color);
    border-color: var(--checkbox-color);
  }

  .time-summary-row.is-compact {
    gap: 7px;
    align-items: center;
  }

  .time-summary-row.is-compact .time-block-range {
    flex: 0 0 auto;
    margin-block-end: 0;
    line-height: 1.2;
  }

  .first-line-wrapper.is-compact {
    flex: 1 1 auto;
    line-height: 1.2;
  }

  .first-line-wrapper.is-compact :global(p) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
