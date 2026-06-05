<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { fromStore, type Readable } from "svelte/store";

  import { settingsSignal } from "../../global-store/settings";
  import { type Task, type WithTime } from "../../task-types";
  import { useStatusBarWidget } from "../hooks/use-status-bar-widget";

  import { SkipForward, Play } from "./lucide";
  import MiniTimeline from "./mini-timeline.svelte";

  const {
    onClick,
    tasksWithTimeForToday,
  }: {
    onClick: () => Promise<void>;
    tasksWithTimeForToday: Readable<Array<WithTime<Task>>>;
  } = $props();

  const { current, next } = $derived(
    fromStore(useStatusBarWidget({ tasksWithTimeForToday })).current,
  );

  const { showNow, showNext, progressIndicator, timestampFormat } = $derived(
    settingsSignal.current,
  );
</script>

<div class="root" onclick={onClick}>
  {#if !current && !next}
    <span class="status-bar-item-segment">All done</span>
  {:else}
    {#if showNow && current}
      <span class="status-bar-item-segment">
        <Play class="status-bar-item-icon" />
        {current.text} (-{current.timeLeft}, till {current.endTime.format(
          timestampFormat,
        )})
      </span>
    {/if}

    {#if showNext && next}
      <span class="status-bar-item-segment">
        <SkipForward class="status-bar-item-icon" />
        {next.text} (in {next.timeToNext})
      </span>
    {/if}

    {#if showNow && current}
      {#if progressIndicator === "pie"}
        <div
          class="status-bar-item-segment progress-pie day-planner"
          data-value={current.percentageComplete}
        ></div>
      {:else if progressIndicator === "bar"}
        <div class="status-bar-item-segment day-planner-progress-bar">
          <div
            style="width: {current.percentageComplete}%;"
            class="day-planner-progress-value"
          ></div>
        </div>
      {/if}
    {/if}
  {/if}

  {#if progressIndicator === "mini-timeline"}
    <MiniTimeline {tasksWithTimeForToday} />
  {/if}
</div>

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  .root {
    display: contents;
  }

  .root :global(.status-bar-item-icon) {
    display: inline-flex;
  }

  .status-bar-item-segment {
    display: flex;
    gap: var(--size-2-1);
    align-items: center;
  }

  .status-bar-item-segment.progress-pie {
    display: block;
  }
</style>
