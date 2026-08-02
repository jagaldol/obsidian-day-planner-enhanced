<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import type { Snippet } from "svelte";

  import { isRemote, type TimelineTimeBlock } from "../../time-block-types";

  import LocalTimeBlock from "./local-time-block.svelte";
  import RemoteTimeBlockContent from "./remote-time-block-content.svelte";
  import TimeBlockBase from "./time-block-base.svelte";
  import TimeBlockControls from "./time-block-controls.svelte";

  const {
    timeBlock,
    bottomDecoration,
  }: {
    timeBlock: TimelineTimeBlock;
    class?: string;
    bottomDecoration?: Snippet;
  } = $props();
</script>

{#if isRemote(timeBlock)}
  <TimeBlockBase {timeBlock}>
    <RemoteTimeBlockContent {bottomDecoration} {timeBlock} />
  </TimeBlockBase>
{:else}
  <TimeBlockControls {timeBlock}>
    {#snippet content({ isActive, onPointerUp, use })}
      <LocalTimeBlock
        {bottomDecoration}
        {isActive}
        onpointerup={onPointerUp}
        {timeBlock}
        {use}
      />
    {/snippet}
  </TimeBlockControls>
{/if}
<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->
