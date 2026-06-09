<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { type Snippet } from "svelte";

  import { MouseButton, vibrationDurationMillis } from "../../constants";
  import { setTimelineSelectionActive } from "../../global-store/timeline-auto-scroll";
  import { isTouchEvent } from "../../util/dom";
  import { createGestures } from "../actions/gestures";
  import { pointerUpOutside } from "../actions/pointer-up-outside";
  import type { HTMLActionArray } from "../actions/use-actions";

  type SelectionState = "primary" | "secondary" | "none";

  interface ChildrenProps {
    use: HTMLActionArray;
    state: SelectionState;
    onpointerup: (event: PointerEvent) => void;
  }

  interface Props {
    children: Snippet<[ChildrenProps]>;
    selectionBlocked?: boolean;
    onSecondarySelect?: (event: MouseEvent | PointerEvent | TouchEvent) => void;
  }

  const {
    children,
    onSecondarySelect,
    selectionBlocked = false,
  }: Props = $props();

  let state = $state<SelectionState>("none");
  const selectionToken = Symbol("selectable");

  function setSelection(newState: SelectionState) {
    if (newState !== "none") {
      if (selectionBlocked) {
        return;
      }

      navigator.vibrate?.(vibrationDurationMillis);
    }

    state = newState;
  }

  $effect(() => {
    setTimelineSelectionActive(selectionToken, state !== "none");

    return () => {
      setTimelineSelectionActive(selectionToken, false);
    };
  });

  function clear() {
    setSelection("none");
  }

  function setPrimary() {
    if (state === "primary") {
      setSelection("none");

      return;
    }

    setSelection("primary");
  }

  function setSecondary(event: PointerEvent | MouseEvent | TouchEvent) {
    if (state === "secondary") {
      setSelection("none");

      return;
    }

    setSelection("secondary");
    onSecondarySelect?.(event);
  }

  const use = [
    createGestures({
      ontap: () => {
        setPrimary();
      },
      onlongpress: (event) => {
        setSecondary(event);
      },
      options: { mouseSupport: false },
    }),
    pointerUpOutside(clear),
  ];

  function handlePointerUp(event: PointerEvent) {
    if (isTouchEvent(event)) {
      return;
    }

    if (event.button === MouseButton.LEFT) {
      setPrimary();
    } else if (event.button === MouseButton.RIGHT) {
      setSecondary(event);
    }
  }
</script>

<svelte:body
  onkeydown={(event: KeyboardEvent) => {
    if (event.key === "Escape") {
      clear();
    }
  }}
/>

{@render children({ use, state, onpointerup: handlePointerUp })}
<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->
