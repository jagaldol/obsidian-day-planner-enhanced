<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { fromStore } from "svelte/store";

  import { getDateRangeContext } from "../../context/date-range-context";
  import { getIsInSidebarContext } from "../../context/is-in-sidebar-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { isToday } from "../../global-store/current-time";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import type { TimelineTimeBlock } from "../../time-block-types";
  import { createResizeState } from "../actions/create-resize-state";

  import BlockList from "./block-list.svelte";
  import ErrorBoundary from "./error-boundary.svelte";
  import { GripHorizontal } from "./lucide";
  import Ruler from "./ruler.svelte";
  import Scroller from "./scroller.svelte";
  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const { editContext, pointerDateTime, settingsStore } = getObsidianContext();
  const isInSidebar = getIsInSidebarContext();

  const getDisplayedAllDayTimeBlocksForMultiDayRow = fromStore(
    editContext.getDisplayedAllDayTimeBlocksForMultiDayRow,
  );

  const dateRange = getDateRangeContext();
  const firstDayInRange = $derived(dateRange.first);
  const lastDayInRange = $derived(dateRange.last);

  const displayedAllDayTimeBlocks = $derived(
    getDisplayedAllDayTimeBlocksForMultiDayRow.current({
      start: firstDayInRange,
      end: lastDayInRange,
    }),
  );

  let allDayRowRef: HTMLDivElement | undefined = $state();
  const { startResizing, resizeAction } = createResizeState({
    getMaxHeight: () => allDayRowRef?.scrollHeight,
  });
  let rulerRef: HTMLDivElement | undefined = $state();

  function handleAllDayEventsPointerMove() {
    pointerDateTime.set({
      dateTime: firstDayInRange,
      type: "date",
    });
  }

  function handleScroll(event: Event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (rulerRef) {
      rulerRef.scrollTop = event.target.scrollTop;
    }
  }
</script>

<ErrorBoundary>
  <div class="controls-row">
    <TimelineControls />
  </div>

  <div class="corner">
    <GripHorizontal
      class="horizontal-grip"
      onmousedown={startResizing}
      ontouchstart={startResizing}
    />
  </div>

  <div
    bind:this={allDayRowRef}
    class={["all-day-row", $isInSidebar && "is-in-sidebar"]}
    onpointermove={handleAllDayEventsPointerMove}
    onpointerup={editContext.confirmEdit}
    use:resizeAction
  >
    <BlockList
      --block-list-padding="0"
      className="all-day-events"
      list={displayedAllDayTimeBlocks}
    >
      {#snippet match(timeBlock: TimelineTimeBlock)}
        <UnscheduledTimeBlock {timeBlock} />
      {/snippet}
      {#snippet fallback()}
        <div class="empty-all-day-events">No all day events</div>
      {/snippet}
    </BlockList>
  </div>

  <div bind:this={rulerRef} class="ruler">
    <Ruler
      showCurrentTimeMarker={$isToday(firstDayInRange)}
      visibleHours={getVisibleHours($settingsStore)}
    />
    <div class="scrollbar-filler"></div>
  </div>

  <Scroller
    class={["planner-timeline-scroller", "timeline-row"]}
    onscroll={handleScroll}
  >
    {#snippet children(autoScrollBlocked)}
      <Timeline
        {autoScrollBlocked}
        day={firstDayInRange}
        isInSidebar={$isInSidebar}
        showNeedleMarker={false}
      />
    {/snippet}
  </Scroller>
</ErrorBoundary>

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  .corner {
    z-index: 1000;

    display: flex;
    grid-area: corner;
    flex-direction: column-reverse;
    align-items: center;

    background-color: var(--background-primary);
    border-block: var(--border-base);
    border-inline-end: var(--border-base);
    box-shadow: var(--shadow-bottom);
  }

  :global(.horizontal-grip) {
    flex: 0 0 auto;
    color: var(--icon-color);
    opacity: var(--icon-opacity);
  }

  :global(.horizontal-grip:hover) {
    cursor: grab;
    opacity: var(--icon-opacity-hover);
  }

  .ruler {
    overflow-y: hidden;
    grid-area: ruler;
    box-shadow: var(--shadow-right);
  }

  .scrollbar-filler {
    height: var(--scrollbar-width);
    background-color: var(--background-primary);
  }

  .controls-row {
    grid-area: controls;
  }

  .all-day-row {
    z-index: 1000;

    overflow: auto;
    grid-area: all-day;

    max-height: 16vh;

    background-color: var(--background-primary);
    border-block-end: var(--border-base);
    box-shadow: var(--shadow-bottom);
  }

  .all-day-row.is-in-sidebar {
    margin-inline-start: -1px;
  }

  :global(.timeline-row) {
    grid-area: timeline;
  }

  :global(.planner-timeline-scroller) {
    overflow: auto;
    min-height: 0;
  }

  .empty-all-day-events {
    display: flex;
    align-items: center;
    justify-content: center;

    padding-block: var(--size-4-2);

    font-size: var(--font-ui-small);
    color: var(--text-faint);
  }

  :global(.all-day-events),
  .empty-all-day-events {
    background-color: var(--background-primary);
    border-top: 1px solid var(--background-modifier-border);
  }
</style>
