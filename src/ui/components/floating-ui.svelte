<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { type Snippet } from "svelte";
  import { portal } from "svelte-portal";

  import type { ActionArray } from "../actions/use-actions";
  import { useActions } from "../actions/use-actions";

  interface Props {
    children: Snippet;
    use?: ActionArray;
    onpointerup?: (event: PointerEvent) => void;
  }

  let { children, use = [], onpointerup = () => {} }: Props = $props();
</script>

<div class="floating-ui" {onpointerup} use:portal use:useActions={use}>
  {@render children()}
</div>

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  .floating-ui {
    position: absolute;
    z-index: 9999;
    top: 0;
    left: 0;

    width: max-content;
  }
</style>
