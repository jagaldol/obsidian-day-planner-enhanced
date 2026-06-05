<script lang="ts">
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import type { Component } from "svelte";

  const {
    key,
    value,
    onclick,
  }: {
    key?: unknown;
    value: string;
    onclick?: () => void;
  } = $props();
</script>

{#if value}
  <span class={["pill", onclick && "clickable"]} {onclick}>
    {#if !key}{:else if typeof key === "string"}
      {key}:
    {:else}
      {@const Component = key as Component<Record<string, unknown>>}

      <Component class="planner-pill-icon" />
    {/if}
    {value}
  </span>
{/if}

<style>
  :global(.planner-pill-icon) {
    flex-shrink: 0;
    width: var(--size-4-3);
    height: var(--size-4-3);
  }

  .pill {
    display: inline-flex;
    gap: var(--size-4-1);
    align-items: center;

    padding: var(--size-2-1) var(--size-4-2);

    font-size: var(--font-ui-small);
    color: var(--text-muted);

    border: var(--border-base);
    border-radius: var(--radius-m);
  }

  .pill.clickable:hover {
    border-color: var(--color-accent);
  }
</style>
