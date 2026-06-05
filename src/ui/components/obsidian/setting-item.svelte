<script lang="ts">
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  const props = $props();
</script>

<div class={["setting-item", props.class]}>
  <div class="setting-item-info">
    <div class="setting-item-name">
      {@render props.name()}
    </div>
  </div>
  <div class="setting-item-control">
    {@render props.control()}
  </div>
</div>

<style>
  .setting-item {
    padding: var(--size-2-3) 0;
  }

  .setting-item-name {
    font-size: var(--font-ui-small);
  }
</style>
