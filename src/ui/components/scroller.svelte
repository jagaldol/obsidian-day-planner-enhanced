<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import type { Snippet } from "svelte";
  import { on } from "svelte/events";

  import { autoScrollResumeDelayMillis } from "../../constants";
  import { getObsidianContext } from "../../context/obsidian-context";
  import {
    createAutoScroll,
    dispatchAutoScrollPointerMove,
    getScrollZones,
    type ClientCoordinates,
  } from "../../util/dom";

  const {
    children,
    onscroll,
    ...rest
  }: {
    children: Snippet<[boolean]>;
    class?: string | string[];
    onscroll?: (event: Event) => void;
  } = $props();

  const {
    editContext: { editOperation },
  } = getObsidianContext();

  let isUnderCursor = $state(false);
  let el: HTMLElement | undefined = $state();
  let autoScrollBlockedUntil = $state(0);
  let autoScrollUnblockTimeout: number | undefined;
  let lastEditPointerCoordinates: ClientCoordinates | undefined;
  const autoScrollBlocked = $derived(
    isUnderCursor ||
      autoScrollBlockedUntil > Date.now() ||
      Boolean($editOperation),
  );

  const { startScroll, stopScroll } = createAutoScroll(
    (scroller, scrollDeltaY) => {
      if (!$editOperation || !lastEditPointerCoordinates) {
        return;
      }

      dispatchAutoScrollPointerMove(
        scroller,
        lastEditPointerCoordinates,
        scrollDeltaY,
      );
    },
  );

  function stopEditAutoScroll() {
    lastEditPointerCoordinates = undefined;
    stopScroll();
  }

  function blockPanOnEdit(el: HTMLElement) {
    const off = on(el, "touchmove", (event) => {
      if ($editOperation) {
        event.preventDefault();
      }
    });

    return {
      destroy() {
        off();
      },
    };
  }

  function delayAutoScroll() {
    autoScrollBlockedUntil = Date.now() + autoScrollResumeDelayMillis;

    if (autoScrollUnblockTimeout !== undefined) {
      window.clearTimeout(autoScrollUnblockTimeout);
    }

    autoScrollUnblockTimeout = window.setTimeout(() => {
      autoScrollBlockedUntil = 0;
      autoScrollUnblockTimeout = undefined;
    }, autoScrollResumeDelayMillis);
  }

  function handleScroll(event: Event) {
    delayAutoScroll();
    onscroll?.(event);
  }

  $effect(() => {
    return () => {
      stopEditAutoScroll();

      if (autoScrollUnblockTimeout !== undefined) {
        window.clearTimeout(autoScrollUnblockTimeout);
      }
    };
  });

  $effect(() => {
    if (!$editOperation) {
      stopEditAutoScroll();
    }
  });
</script>

<div
  bind:this={el}
  class={["scroller", rest.class]}
  onmouseenter={() => {
    isUnderCursor = true;
  }}
  onmouseleave={() => {
    isUnderCursor = false;
  }}
  onpointerdown={delayAutoScroll}
  onpointerleave={stopEditAutoScroll}
  onpointermove={(event) => {
    if (!$editOperation || !el) {
      stopEditAutoScroll();

      return;
    }

    lastEditPointerCoordinates = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    const scrollZones = getScrollZones(event, el);

    if (scrollZones.isInTopScrollZone) {
      startScroll({ el, direction: "up" });
    } else if (scrollZones.isInBottomScrollZone) {
      startScroll({ el, direction: "down" });
    } else {
      stopScroll();
    }
  }}
  onpointerup={() => {
    stopEditAutoScroll();
    delayAutoScroll();
  }}
  onscroll={handleScroll}
  onwheel={delayAutoScroll}
  use:blockPanOnEdit
>
  {@render children(autoScrollBlocked)}
</div>

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  .scroller {
    display: flex;
    background-color: var(--background-primary);
  }
</style>
