<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { type Snippet } from "svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { currentTimeSignal } from "../../global-store/current-time";
  import {
    clearTimelineTaskSelection,
    isLocatedTimelineTaskSelectionMatch,
    isTimelineTaskSelectionMatch,
    pendingTimelineTaskSelection,
  } from "../../global-store/timeline-task-selection";
  import {
    getTimeRangeMatch,
    removeTimeRangeFromLine,
    replaceOrPrependTimeRange,
  } from "../../parser/parser";
  import { selectActiveLogTimeBlocks } from "../../redux/index/index-selectors";
  import { type EditableTimeBlock } from "../../time-block-types";
  import { createMarkdownListTokens, getFirstLine } from "../../util/markdown";
  import type { HTMLActionArray } from "../actions/use-actions";
  import { createTimeBlockMenu } from "../time-block-menu";

  import DragControls from "./drag-controls.svelte";
  import FloatingControls from "./floating-controls.svelte";
  import ResizeControls from "./resize-controls.svelte";
  import Selectable from "./selectable.svelte";
  import { getDisabledFloatingControls } from "./time-block-control-rules";

  interface TimeBlockProps {
    isActive: boolean;
    onPointerUp: (event: PointerEvent) => void;
    use: HTMLActionArray;
  }

  const {
    timeBlock,
    content,
  }: {
    timeBlock: EditableTimeBlock;
    class?: string;
    content: Snippet<[TimeBlockProps]>;
  } = $props();

  const {
    editContext: { editOperation },
    workspaceFacade,
    logEntryEditor,
    openNestedItemsEditModal,
    removeTask: removeTaskFromPlan,
    editText,
    editLine,
    useSelector,
  } = getObsidianContext();

  const activeLogTimeBlocks = useSelector((state) =>
    selectActiveLogTimeBlocks(state, currentTimeSignal.current),
  );

  async function editTaskSummary() {
    if (timeBlock.source === "unwritten") {
      throw new Error("Cannot edit the summary of an unwritten time block");
    }

    // todo: replace with getOnelineSummary()
    const firstLine = getFirstLine(timeBlock.text);
    const timestampMatch = getTimeRangeMatch(firstLine);
    const summary = removeTimeRangeFromLine(firstLine).trim();

    const next = await editText({
      initialText: summary,
      sourcePath: timeBlock.path,
      getDescriptionText: (value) =>
        value.trim().length === 0
          ? "Start typing to update task text"
          : `Update to "${value}"`,
    });

    if (next === undefined || next === summary) {
      return;
    }

    const updatedFirstLine = timestampMatch
      ? replaceOrPrependTimeRange(next, timestampMatch.timeRange)
      : next;

    await editLine({
      path: timeBlock.path,
      position: timeBlock.position.start,
      contents: `${createMarkdownListTokens(timeBlock)} ${updatedFirstLine}`,
    });
  }

  async function removeTask() {
    await removeTaskFromPlan(timeBlock);
  }

  const autoSelect = $derived(
    $pendingTimelineTaskSelection !== undefined &&
      isTimelineTaskSelectionMatch(timeBlock, $pendingTimelineTaskSelection),
  );
  const startsBeforeSegment = $derived(
    timeBlock.timelineSegment?.startsBeforeSegment === true,
  );
  const continuesAfterSegment = $derived(
    timeBlock.timelineSegment?.continuesAfterSegment === true,
  );
  const disabledFloatingControls = $derived(
    getDisabledFloatingControls(timeBlock),
  );

  function handleAutoSelect() {
    const target = $pendingTimelineTaskSelection;

    if (target && isLocatedTimelineTaskSelectionMatch(timeBlock, target)) {
      clearTimelineTaskSelection();
    }
  }
</script>

<Selectable
  {autoSelect}
  onAutoSelect={handleAutoSelect}
  onSecondarySelect={(event) =>
    createTimeBlockMenu({
      event,
      timeBlock,
      activeLogTimeBlocks: activeLogTimeBlocks.current,
      workspaceFacade,
      logEntryEditor,
      onEdit: editTaskSummary,
      onEditNestedItems: () => openNestedItemsEditModal(timeBlock),
      onDelete: removeTask,
    })}
  selectionBlocked={Boolean($editOperation)}
>
  {#snippet children(selectable)}
    <FloatingControls
      active={selectable.state === "primary"}
      disabled={disabledFloatingControls}
    >
      {#snippet anchor(floatingControls)}
        {@render content({
          isActive: selectable.state !== "none",
          onPointerUp: selectable.onpointerup,
          use: [...selectable.use, ...floatingControls.actions],
        })}
      {/snippet}

      {#snippet topEnd({ isActive, setIsActive })}
        <DragControls {isActive} {setIsActive} {timeBlock} />
      {/snippet}

      {#snippet bottom({ isActive, setIsActive })}
        {#if !timeBlock.isAllDayEvent && !continuesAfterSegment}
          <ResizeControls {isActive} reverse {setIsActive} {timeBlock} />
        {/if}
      {/snippet}

      {#snippet top({ isActive, setIsActive })}
        {#if !timeBlock.isAllDayEvent && !startsBeforeSegment}
          <ResizeControls
            fromTop
            {isActive}
            reverse
            {setIsActive}
            {timeBlock}
          />
        {/if}
      {/snippet}
    </FloatingControls>
  {/snippet}
</Selectable>
<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->
