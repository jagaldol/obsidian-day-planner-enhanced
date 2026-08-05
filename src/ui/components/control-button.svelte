<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { LoaderCircle } from "lucide-svelte";
  import { type Snippet } from "svelte";

  const {
    label = "",
    isActive = false,
    disabled = false,
    showPendingIndicator = true,
    classes,
    onclick,
    icon,
    children,
    ...rest
  }: {
    label?: string;
    class?: object | string;
    isActive?: boolean;
    disabled?: boolean;
    showPendingIndicator?: boolean;
    classes?: string;
    onclick: (event: MouseEvent) => void | Promise<void>;
    icon?: Snippet;
    children?: Snippet;
  } = $props();

  let isPending = $state(false);
  const displayPendingIndicator = $derived(isPending && showPendingIndicator);
</script>

<div
  class={["clickable-icon", classes, rest.class, { "is-active": isActive }]}
  aria-busy={isPending}
  aria-disabled={disabled}
  aria-label={label}
  onclick={async (event: MouseEvent) => {
    try {
      isPending = true;

      await onclick(event);
    } finally {
      isPending = false;
    }
  }}
>
  <div
    class={["control-button-content", displayPendingIndicator && "is-pending"]}
  >
    {@render icon?.()}
    {@render children?.()}
  </div>

  {#if displayPendingIndicator}
    <span class="pending-indicator" aria-hidden="true">
      <LoaderCircle class="is-spinning svg-icon" />
    </span>
  {/if}
</div>

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  .clickable-icon {
    position: relative;

    display: flex;
    gap: var(--size-2-1);

    color: var(--color, var(--icon-color));
    white-space: nowrap;

    border: var(--control-button-border, none);
    border-radius: var(--border-radius, var(--radius-s));
  }

  .control-button-content {
    display: contents;
  }

  .control-button-content.is-pending {
    visibility: hidden;
  }

  .pending-indicator {
    pointer-events: none;

    position: absolute;
    inset: 0;

    display: grid;
    place-items: center;
  }

  :global(.is-spinning) {
    animation: spin 1.5s infinite linear;
  }
</style>
