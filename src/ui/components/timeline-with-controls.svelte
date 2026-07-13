<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { fromStore } from "svelte/store";

  import { getDateRangeContext } from "../../context/date-range-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import {
    getAvailableTimelineColumns,
    getVisibleHours,
  } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import type { Task } from "../../task-types";
  import { createColumnSelectionMenu } from "../column-selection-menu";

  import BlockList from "./block-list.svelte";
  import ControlButton from "./control-button.svelte";
  import ErrorBoundary from "./error-boundary.svelte";
  import Tree from "./obsidian/tree.svelte";
  import ResizeHandle from "./resize-handle.svelte";
  import ResizeableBox from "./resizeable-box.svelte";
  import Ruler from "./ruler.svelte";
  import Scroller from "./scroller.svelte";
  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const { editContext, pointerDateTime } = getObsidianContext();

  const getDisplayedAllDayTasksForMultiDayRow = fromStore(
    editContext.getDisplayedAllDayTasksForMultiDayRow,
  );
  const editOperation = fromStore(editContext.editOperation);

  const dateRange = fromStore(getDateRangeContext());
  const firstDayInRange = $derived(dateRange.current[0]);

  const displayedAllDayTasks = $derived(
    getDisplayedAllDayTasksForMultiDayRow.current({
      start: firstDayInRange,
      end: dateRange.current[dateRange.current.length - 1],
    }),
  );

  function handleResizeableBoxPointerMove() {
    pointerDateTime.set({
      dateTime: dateRange.current[0],
      type: "date",
    });
  }

  const { timeTracker, planner } = $derived(
    getAvailableTimelineColumns($settings),
  );
</script>

<ErrorBoundary>
  <TimelineControls />

  {#if $settings.showUncheduledTasks}
    <Tree
      onpointermove={handleResizeableBoxPointerMove}
      onpointerup={editContext.confirmEdit}
      title="All day events"
    >
      {#snippet flair()}
        {#if editOperation.current}
          Drag here to schedule all-day events
        {:else}
          {String(displayedAllDayTasks.length)}
        {/if}
      {/snippet}
      {#if displayedAllDayTasks.length > 0}
        <ResizeableBox class="unscheduled-task-container">
          {#snippet children(startEdit)}
            <BlockList list={displayedAllDayTasks}>
              {#snippet match(task: Task)}
                <UnscheduledTimeBlock
                  --time-block-padding="var(--size-2-1) 0"
                  {task}
                />
              {/snippet}
            </BlockList>
            <ResizeHandle on:mousedown={startEdit} />
          {/snippet}
        </ResizeableBox>
      {/if}
    </Tree>
  {/if}

  {#if $settings.showTimelineInSidebar}
    <Tree title="Timeline">
      {#snippet controls()}
        <ControlButton
          --border-radius="0"
          label="Timeline Settings"
          onclick={(event) => {
            createColumnSelectionMenu({ settings, event });
          }}
        >
          <span class="control-text">
            {#if planner && timeTracker}
              Planner | Tracker
            {:else if planner}
              Planner
            {:else if timeTracker}
              Tracker
            {/if}
          </span>
        </ControlButton>
      {/snippet}
      <Scroller
        class={["planner-timeline-scroller", "planner-flex-scrollable"]}
      >
        {#snippet children(autoScrollBlocked)}
          <Ruler visibleHours={getVisibleHours($settings)} />
          <Timeline {autoScrollBlocked} day={firstDayInRange} />
        {/snippet}
      </Scroller>
    </Tree>
  {/if}
</ErrorBoundary>

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  :global(svg.svg-icon.planner-settings-icon) {
    width: var(--icon-s);
    height: var(--icon-s);
  }

  :global(.planner-timeline-scroller) {
    border-top: var(--border-base);
  }

  :global(.unscheduled-task-container) {
    overflow: auto;
  }

  .control-text {
    font-size: var(--font-ui-small);
    color: var(--text-faint);
  }

  .control-text:hover {
    color: var(--text-muted);
  }
</style>
