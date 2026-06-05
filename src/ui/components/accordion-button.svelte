<script lang="ts">
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { type Component, type Snippet } from "svelte";

  import ControlButton from "./control-button.svelte";

  const {
    onclick,
    children,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Icon,
  }: { onclick: () => void; children: Snippet; Icon: Component } = $props();
</script>

<ControlButton classes="planner-clickable-icon" {onclick}>
  <div class="button-text">
    <Icon class="svg-icon" />
    {@render children()}
  </div>
</ControlButton>

<!-- eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -->

<style>
  :global(.planner-clickable-icon) {
    padding: var(--size-4-1) 0 var(--size-2-1) var(--size-4-4);
    border-radius: 0;
  }

  .button-text {
    display: inline-flex;
    gap: var(--size-4-1);
  }
</style>
