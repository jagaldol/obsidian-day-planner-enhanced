<script lang="ts">
  import { currentTime } from "../../global-store/current-time";
  import {
    getHourSize,
    momentToTimelineOffset,
  } from "../../global-store/derived-settings";
  import { settingsStore } from "../../global-store/settings";
  import { hoursToMoment } from "../../util/moment";

  export let showCurrentTimeMarker = false;
  export let visibleHours: number[];

  $: currentTimeOffset = momentToTimelineOffset($currentTime, $settingsStore);
</script>

<div class="hours-container">
  {#if showCurrentTimeMarker}
    <div style:top="{currentTimeOffset}px" class="ruler-needle-line"></div>
  {/if}

  {#each visibleHours as hour}
    <div style:flex-basis="{getHourSize($settingsStore)}px" class="hour">
      {hoursToMoment(hour).format($settingsStore.hourFormat)}
    </div>
  {/each}
</div>

<style>
  .hours-container {
    position: sticky;
    z-index: 5;
    left: 0;

    display: flex;
    flex-direction: column;

    height: fit-content;

    background-color: var(--background-primary);
    border-right: var(--border-base);
    box-shadow: var(--ruler-box-shadow, none);
  }

  .hour {
    position: relative;
    z-index: 2;

    display: flex;
    flex: 1 0 0;
    flex-direction: row-reverse;

    padding-inline: var(--size-4-2);

    font-size: var(--font-ui-smaller);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
  }

  .hour:not(:last-child) {
    border-bottom: var(--border-base);
  }

  .ruler-needle-line {
    pointer-events: none;

    position: absolute;
    z-index: 1;
    right: -1px;
    left: 0;

    height: 2px;

    background-color: var(--planner-current-time-color, #10b981);
  }

  .ruler-needle-line::before {
    content: "";

    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);

    width: 10px;
    height: 6px;

    background-color: var(--planner-current-time-color, #10b981);
    border-radius: 2px;
  }
</style>
