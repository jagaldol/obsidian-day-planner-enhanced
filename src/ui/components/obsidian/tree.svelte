<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { type Snippet } from "svelte";

  import RightTriangle from "./right-triangle.svelte";

  const {
    children,
    title,
    flair,
    controls,
    onpointermove,
    onpointerup,
  }: {
    title: string;
    children: Snippet;
    flair?: Snippet;
    controls?: Snippet;
    onpointermove?: (event: PointerEvent) => void;
    onpointerup?: (event: PointerEvent) => void;
  } = $props();

  let isTreeVisible = $state(true);

  const titleColor = $derived(
    isTreeVisible ? "var(--text-muted)" : "var(--text-faint)",
  );

  function toggleTree() {
    isTreeVisible = !isTreeVisible;
  }
</script>

<!--Partially uses Obsidian's classes for search result matches-->
<div class="tree-container" {onpointermove} {onpointerup}>
  <div class="tree-header-container">
    <div class="tree-item-self is-clickable" onclick={toggleTree}>
      <div
        class={[
          "tree-item-icon",
          "collapse-icon",
          !isTreeVisible && "is-collapsed",
        ]}
      >
        <RightTriangle />
      </div>
      <div style:color={titleColor} class="tree-item-inner">{title}</div>
      {#if flair}
        <div class="tree-item-flair-outer">
          <span class="tree-item-flair">{@render flair()}</span>
        </div>
      {/if}
    </div>
    {#if controls && isTreeVisible}
      {@render controls()}
    {/if}
  </div>
  {#if isTreeVisible}
    {@render children()}
  {/if}
</div>

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  .tree-container {
    display: flex;
    flex-direction: column;
  }

  .tree-header-container {
    display: flex;
  }

  .tree-container:not(:last-child) {
    border-bottom: var(--border-base);
  }

  .tree-item-inner {
    font-weight: var(--font-medium);
  }

  .tree-item-self {
    flex: 1;
    margin-bottom: 0;
    border-radius: 0;
  }

  .tree-item-flair-outer {
    align-self: center;
  }

  .tree-item-flair {
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    height: var(--icon-xs);
  }
</style>
