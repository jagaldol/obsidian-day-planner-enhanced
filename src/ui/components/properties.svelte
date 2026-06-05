<script lang="ts">
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import type { Snippet } from "svelte";

  const props: { children: Snippet } = $props();
</script>

<div class="properties-wrapper">
  {@render props.children()}
</div>

<!-- eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -->

<style>
  .properties-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-4-1);
    align-items: center;

    padding: var(--size-4-1);
  }
</style>
