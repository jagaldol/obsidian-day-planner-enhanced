<script lang="ts">
  import type { Snippet } from "svelte";

  import type { FrontmatterLogTimeBlock } from "../../time-block-types";

  import TimeBlockContentLayout from "./time-block-content-layout.svelte";

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Svelte validates the typed $props rune during svelte-check.
  const {
    timeBlock,
    bottomDecoration,
  }: { timeBlock: FrontmatterLogTimeBlock; bottomDecoration?: Snippet } =
    $props();
</script>

<TimeBlockContentLayout {bottomDecoration}>
  {#snippet title()}
    <div class="file-name">
      {timeBlock.text}
    </div>
  {/snippet}
</TimeBlockContentLayout>

<style>
  .file-name {
    font-weight: var(
      --planner-time-block-summary-font-weight,
      var(--font-semibold)
    );
  }
</style>
