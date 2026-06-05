<script lang="ts">
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import type { Snippet } from "svelte";

  const { children }: { children: Snippet } = $props();
</script>

<div class="block-controls">
  {@render children()}
</div>

<!-- eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -->

<style>
  .block-controls {
    --icon-size: var(--icon-xs);

    display: flex;
    align-items: flex-start;
    padding: var(--size-4-1);
  }
</style>
