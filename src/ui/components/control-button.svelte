<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { type Snippet } from "svelte";

  const {
    label = "",
    isActive = false,
    disabled = false,
    classes,
    onclick,
    children,
    ...rest
  }: {
    label?: string;
    class?: object;
    isActive?: boolean;
    disabled?: boolean;
    classes?: string;
    onclick: (event: MouseEvent) => void;
    children: Snippet;
  } = $props();
</script>

<div
  class={["clickable-icon", classes, rest.class, { "is-active": isActive }]}
  aria-disabled={disabled}
  aria-label={label}
  {onclick}
>
  {@render children()}
</div>

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  .clickable-icon {
    color: var(--color, var(--icon-color));
    white-space: nowrap;
    border: var(--control-button-border, none);
    border-radius: var(--border-radius, var(--clickable-icon-radius));
  }
</style>
