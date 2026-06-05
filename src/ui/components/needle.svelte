<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { currentTimeSignal } from "../../global-store/current-time";
  import { timeToTimelineOffset } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { getMinutesSinceMidnight } from "../../util/moment";

  interface Props {
    autoScrollBlocked?: boolean;
  }

  const { autoScrollBlocked = false }: Props = $props();

  let el: HTMLDivElement;
  const coords = $derived(
    timeToTimelineOffset(
      getMinutesSinceMidnight(currentTimeSignal.current),
      $settings,
    ),
  );

  function scrollIntoView() {
    if ($settings.centerNeedle && !autoScrollBlocked) {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    coords;
    scrollIntoView();
  });
</script>

<div
  bind:this={el}
  style:top="{coords}px"
  class="needle-line absolute-stretch-x"
></div>

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  .needle-line {
    pointer-events: none;

    z-index: 1;
    left: calc(-1 * var(--planner-ruler-width, 36px));

    height: 2px;

    background-color: var(--planner-current-time-color, #10b981);
  }

  .needle-line::before {
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
