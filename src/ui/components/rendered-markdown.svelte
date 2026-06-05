<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask } from "../../task-types";
  import { getMinutesSinceMidnight } from "../../util/moment";
  import { createTimestamp, toRenderableMarkdown } from "../../util/task-utils";
  import { addLineDataToCheckboxes, isHTMLElement } from "../../util/dom";
  import { on } from "svelte/events";
  import type { Snippet } from "svelte";

  const { task, children }: { task: LocalTask; children: Snippet } = $props();

  const { renderMarkdown, toggleCheckboxInFile, settings } =
    getObsidianContext();

  type NestedListItem = NonNullable<LocalTask["children"]>[number];

  function stopPropagationForElWithLineData(event: Event) {
    if (isHTMLElement(event.target) && event.target.dataset.line) {
      event.stopPropagation();
    }
  }

  function getLineNumberFromEvent(event: PointerEvent) {
    if (!isHTMLElement(event.target)) {
      return;
    }

    return Number(event.target.dataset.line);
  }

  async function handlePointerUp(event: PointerEvent) {
    if (!task.location) {
      return;
    }

    const line = getLineNumberFromEvent(event);

    if (!line) {
      return;
    }

    event.stopPropagation();

    await toggleCheckboxInFile(task.location.path, line);
  }

  function createRenderMarkdownAttachment(
    markdown: string,
    taskLines: Array<number | undefined>,
  ) {
    return (el: HTMLElement) => {
      const destroyMarkdown = renderMarkdown(el, markdown);

      addLineDataToCheckboxes(el, taskLines);

      const offPointerUp = on(el, "pointerup", handlePointerUp);
      const offMouseUp = on(el, "mouseup", stopPropagationForElWithLineData);
      // todo: fix checkboxes
      const offTouchEnd = on(el, "touchend", stopPropagationForElWithLineData);

      return () => {
        destroyMarkdown();
        offPointerUp();
        offMouseUp();
        offTouchEnd();
      };
    };
  }

  const { listItem, nestedListItems } = $derived(toRenderableMarkdown(task));
  const timeRange = $derived(
    task.isAllDayEvent
      ? undefined
      : createTimestamp(
          getMinutesSinceMidnight(task.startTime),
          task.durationMinutes,
          $settings.timestampFormat,
        ),
  );
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
    return entries.flatMap((child) => [child, ...flatten(child.children)]);
  }

  const nestedItems = $derived(
    $settings.showSubtasksInTaskBlocks ? flatten(task.children) : [],
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

  const listItemLine = $derived(task.location?.position.start.line);
  const nestedListItemLines = $derived(
    nestedItems
      .filter((task) => task.task !== undefined)
      .map((item) => item.position.start.line),
  );
</script>

<div
  class={[
    "rendered-markdown",
    "planner-sticky-block-content",
    isCompact && "is-compact",
    useStackedHeader && "is-stacked-header",
  ]}
>
  <div class="time-summary-row">
    {#if timeRange}
      <div class="time-block-range">{timeRange}</div>
    {/if}

    <div
      class="first-line-wrapper"
      {@attach createRenderMarkdownAttachment(listItem, [listItemLine])}
    ></div>
  </div>

  {@render children?.()}

  {#if $settings.showSubtasksInTaskBlocks && nestedListItems}
    <div
      class="lines-after-first-wrapper"
      {@attach createRenderMarkdownAttachment(
        nestedListItems,
        nestedListItemLines,
      )}
    ></div>
  {/if}
</div>

<style>
  .rendered-markdown {
    --checkbox-size: var(--planner-time-block-font-size, var(--font-ui-small));

    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1 0 0;
    flex-direction: column;

    min-width: 0;
    padding: var(--rendered-markdown-padding, 9px 11px 7px);

    color: var(--text-muted);
  }

  .time-summary-row {
    display: flex;
    gap: 8px;
    align-items: baseline;
    min-width: 0;
  }

  :global(.is-mobile) .rendered-markdown {
    --checkbox-size: var(
      --planner-time-block-font-size,
      var(--font-ui-smaller)
    );
  }

  .rendered-markdown :global(p),
  .rendered-markdown :global(ul) {
    margin-block: 0;
  }

  .rendered-markdown :global(ul),
  .rendered-markdown :global(ol) {
    padding-inline-start: var(--size-4-5);
  }

  .rendered-markdown :global(input[type="checkbox"]) {
    top: 2px;
    margin-inline-end: 4px;
    border-color: var(--text-muted);
  }

  .rendered-markdown :global(li) {
    color: var(--text-muted);
  }

  .rendered-markdown :global(li.task-list-item[data-task="x"]),
  .rendered-markdown :global(li.task-list-item[data-task="X"]) {
    color: var(--text-faint);
  }

  .time-block-range {
    overflow: hidden;
    flex: 0 0 auto;

    margin-block-end: 0;

    font-size: 0.86em;
    font-weight: var(--font-medium);
    font-variant-numeric: tabular-nums;
    line-height: 1.25;
    color: var(--text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .first-line-wrapper {
    overflow: hidden;
    flex: 1 1 auto;

    min-width: 0;

    font-weight: var(
      --planner-time-block-summary-font-weight,
      var(--font-semibold)
    );
    line-height: 1.28;
    color: var(--text-normal);
  }

  .first-line-wrapper :global(p) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .is-stacked-header .time-summary-row {
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
  }

  .is-stacked-header .first-line-wrapper {
    width: 100%;
  }

  .is-stacked-header .first-line-wrapper :global(p) {
    white-space: normal;
  }

  .lines-after-first-wrapper {
    --nested-timeline-color: var(--time-block-strip-color, var(--color-accent));

    overflow: visible;
    min-width: 0;
    margin-block-start: 4px;
    padding-inline-start: 8px;
  }

  .is-stacked-header .lines-after-first-wrapper {
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
    font-weight: var(--font-medium);
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
    background-color: #22c55e;
    border-color: #22c55e;
  }

  .is-compact {
    justify-content: center;
    padding-block: 3px;
  }

  .is-compact .time-summary-row {
    display: flex;
    gap: 7px;
    align-items: center;
    min-width: 0;
  }

  .is-compact .time-block-range {
    flex: 0 0 auto;
    margin-block-end: 0;
    line-height: 1.2;
  }

  .is-compact .first-line-wrapper {
    flex: 1 1 auto;
    min-width: 0;
    line-height: 1.2;
  }

  .is-compact .first-line-wrapper :global(p) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
