<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import { momentToTimelineOffset } from "../../global-store/derived-settings";
  import type { HorizontalPlacing } from "../../overlap/horizontal-placing";
  import { selectRecurringPreviewsForDay } from "../../redux/index/recurring-preview-selectors";
  import { createRecurringPreviewMenu } from "../recurring-preview-menu";

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Svelte validates the typed $props rune during svelte-check.
  const {
    dayKey,
    placings = new Map(),
  }: { dayKey: string; placings?: Map<string, HorizontalPlacing> } = $props();
  const context = getObsidianContext();
  const { useSelector, settingsSignal } = context;
  const previews = useSelector((state) =>
    selectRecurringPreviewsForDay(state, dayKey),
  );
</script>

<div class="recurring-previews">
  {#each previews.current.filter((preview) => !preview.isAllDay) as preview (preview.id)}
    <div
      style:top="{momentToTimelineOffset(
        preview.startTime,
        settingsSignal.current,
      )}px"
      style:height="{preview.durationMinutes *
        settingsSignal.current.zoomLevel}px"
      style:left="{placings.get(preview.id)?.offsetPercent ?? 0}%"
      style:width="{placings.get(preview.id)?.spanPercent ?? 100}%"
      class="recurring-preview"
      aria-label={`Recurring preview: ${preview.title}`}
      oncontextmenu={(event) =>
        createRecurringPreviewMenu(event, preview, context)}
      onpointerdown={(event) => event.stopPropagation()}
      onpointerup={(event) => event.stopPropagation()}
      role="note"
    >
      <div class="preview-heading">
        <span class="preview-time"
          >{preview.startTime.format(
            settingsSignal.current.timestampFormat,
          )}–{preview.startTime
            .clone()
            .add(preview.durationMinutes, "minutes")
            .format(settingsSignal.current.timestampFormat)}</span
        >
      </div>
      <div class="preview-title">{preview.title}</div>
    </div>
  {/each}
</div>

<style>
  .recurring-previews {
    pointer-events: none;

    position: absolute;
    z-index: 0;
    inset: 0;

    overflow: hidden;
  }

  .recurring-preview {
    pointer-events: auto;

    position: absolute;

    overflow: hidden;

    box-sizing: border-box;
    padding: 3px 8px;

    color: var(--text-faint);

    background: color-mix(in srgb, var(--text-muted) 9%, transparent);
  }

  .preview-heading {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    font-size: var(--font-smallest);
  }

  .preview-title {
    overflow: hidden;
    font-size: var(--font-ui-small);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
