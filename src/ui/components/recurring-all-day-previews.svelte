<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import { currentTimeSignal } from "../../global-store/current-time";
  import { selectRecurringPreviewsForDay } from "../../redux/index/recurring-preview-selectors";
  import { createRecurringPreviewMenu } from "../recurring-preview-menu";

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Svelte validates the typed $props rune during svelte-check.
  const {
    dayKey,
    column,
    showEmpty = false,
  }: { dayKey: string; column?: number; showEmpty?: boolean } = $props();
  const context = getObsidianContext();
  const { useSelector } = context;
  const previews = useSelector((state) =>
    selectRecurringPreviewsForDay(state, dayKey),
  );
  const visiblePreviews = $derived(
    dayKey < currentTimeSignal.current.format("YYYY-MM-DD")
      ? []
      : previews.current.filter((preview) => preview.isAllDay),
  );
</script>

{#each visiblePreviews as preview (preview.id)}
  <div
    style:grid-column={column}
    class="recurring-all-day-preview"
    aria-label={`Recurring preview: ${preview.title}`}
    oncontextmenu={(event) =>
      createRecurringPreviewMenu(event, preview, context)}
    onpointerdown={(event) => event.stopPropagation()}
    onpointerup={(event) => event.stopPropagation()}
    role="note"
  >
    {preview.title}
  </div>
{:else}
  {#if showEmpty}
    <div class="empty-all-day-events">No all day events</div>
  {/if}
{/each}

<style>
  .recurring-all-day-preview {
    overflow: hidden;

    min-width: 0;
    padding: var(--size-4-2);

    font-size: var(--font-ui-small);
    color: var(--text-faint);
    text-overflow: ellipsis;
    white-space: nowrap;

    background: color-mix(in srgb, var(--text-muted) 9%, transparent);
  }

  .empty-all-day-events {
    display: flex;
    align-items: center;
    justify-content: center;

    padding-block: var(--size-4-2);

    font-size: var(--font-ui-small);
    color: var(--text-faint);

    background-color: var(--background-primary);
    border-top: 1px solid var(--background-modifier-border);
  }
</style>
