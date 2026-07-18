<script lang="ts">
  import type { Snippet } from "svelte";

  const {
    title,
    contents,
    bottomDecoration,
    completed = false,
    ...rest
  }: {
    title: Snippet;
    contents?: Snippet;
    bottomDecoration?: Snippet;
    completed?: boolean;
    class?: string | false;
  } = $props();
</script>

<div class={["layout", rest.class, completed && "is-completed"]}>
  {@render title()}
  {@render contents?.()}
  {@render bottomDecoration?.()}
</div>

<style>
  .layout {
    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1 0 0;
    flex-direction: column;
    gap: var(--time-block-content-layout-gap);

    min-width: 0;
    padding: var(
      --time-block-content-layout-padding,
      var(--size-2-1) var(--size-4-1)
    );

    color: var(--time-block-content-layout-color, var(--text-muted));
  }

  .layout.is-completed {
    color: var(--text-faint);
  }
</style>
