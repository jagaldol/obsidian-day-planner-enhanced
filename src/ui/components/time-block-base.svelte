<script lang="ts">
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { type Snippet } from "svelte";

  import type { Task } from "../../task-types";
  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";
  import { useColorOverrides } from "../hooks/use-color.svelte";

  interface Props {
    children: Snippet;
    blockEndDecoration?: Snippet;
    task: Task;
    use?: ActionArray;
    onpointerup?: (event: PointerEvent) => void;
  }

  const {
    onpointerup,
    children,
    blockEndDecoration,
    task,
    use = [],
  }: Props = $props();

  const {
    properContrastColors: { normal, muted, faint },
    backgroundColor,
  } = $derived(useColorOverrides({ task }));
</script>

<div class="padding">
  <div
    style:--text-faint={faint}
    style:--text-muted={muted}
    style:--text-normal={normal}
    style:--time-block-bg-color={backgroundColor}
    class={[
      "content",
      task.truncated?.includes("left") && "truncated-left",
      task.truncated?.includes("right") && "truncated-right",
      task.truncated?.includes("bottom") && "truncated-bottom",
    ]}
    {onpointerup}
    use:useActions={use}
  >
    {@render children()}

    {@render blockEndDecoration?.()}
  </div>
</div>

<style>
  .padding {
    position: var(--time-block-position, static);
    z-index: var(--time-block-z-index, auto);
    top: var(--time-block-top, 0);
    left: var(--time-block-left, 0);

    display: flex;
    grid-column: var(--time-block-grid-column, unset);

    width: var(--time-block-width, 100%);
    height: var(--time-block-height, auto);
    padding: var(--time-block-padding, 1px 3px 3px);
  }

  .content {
    position: relative;

    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr auto;
    flex: 1 0 0;

    font-family: var(--planner-time-block-font-family, var(--font-interface));
    font-size: var(--planner-time-block-font-size, var(--font-ui-small));
    color: var(--text-muted);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    background-color: var(--time-block-bg-color, var(--background-primary));
    background-image: linear-gradient(
        var(--time-block-separator-color, transparent),
        var(--time-block-separator-color, transparent)
      ),
      linear-gradient(
        var(--time-block-separator-color, transparent),
        var(--time-block-separator-color, transparent)
      );
    background-repeat: no-repeat;
    background-position:
      top left,
      bottom left;
    background-size:
      100% var(--time-block-separator-top-width, 0),
      100% var(--time-block-separator-bottom-width, 0);
    border-color: var(
      --time-block-border-color-override,
      var(--time-block-border-color, var(--background-modifier-border))
    );
    border-style: solid;
    border-width: var(
        --time-block-border-top-width,
        var(--time-block-border-width, 1px)
      )
      var(--time-block-border-right-width, var(--time-block-border-width, 1px))
      var(--time-block-border-bottom-width, var(--time-block-border-width, 1px))
      var(--time-block-border-left-width, var(--time-block-border-width, 1px));
    border-radius: var(--time-block-border-radius, 6px);
    box-shadow: var(--time-block-box-shadow);
  }

  .content::before {
    pointer-events: none;
    content: "";

    position: absolute;
    z-index: 1;
    top: 0;
    bottom: 0;
    left: 0;

    width: var(--time-block-strip-width, 0);

    background-color: var(--time-block-strip-color, transparent);
  }

  .content::after {
    pointer-events: none;
    content: "";

    position: absolute;
    z-index: 2;
    inset: 0;

    box-sizing: border-box;

    border: var(--time-block-outline-width, 0) solid
      var(--time-block-outline-color, transparent);
  }

  :global(.is-mobile) .content {
    font-size: var(--planner-time-block-font-size, var(--font-ui-smaller));
  }

  .truncated-left {
    border-left-style: dashed;
    border-left-width: 2px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  .truncated-right {
    border-right-style: dashed;
    border-right-width: 2px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .truncated-bottom {
    border-bottom-style: dashed;
    border-bottom-width: 2px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }
</style>
