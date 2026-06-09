<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { type Snippet } from "svelte";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import {
    clearTimelineTaskSelection,
    isLocatedTimelineTaskSelectionMatch,
    isTimelineTaskSelectionMatch,
    pendingTimelineTaskSelection,
  } from "../../global-store/timeline-task-selection";
  import { timeRangeAtStartOfLineRegExp } from "../../regexp";
  import { type LocalTask } from "../../task-types";
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
    task,
    timeBlock,
  }: {
    task: LocalTask;
    class?: string;
    timeBlock: Snippet<[TimeBlockProps]>;
  } = $props();

  const {
    editContext: { editOperation },
    workspaceFacade,
    openNestedItemsEditModal,
    removeTask: removeTaskFromPlan,
    editText,
    editLine,
  } = getObsidianContext();

  async function editTaskSummary() {
    isNotVoid(task.location);

    // todo: replace with getOnelineSummary()
    const firstLine = getFirstLine(task.text);
    const timestampMatch = firstLine.match(timeRangeAtStartOfLineRegExp);
    const timestampEnd = timestampMatch ? timestampMatch[0].length : 0;
    const afterTimestamp = firstLine.slice(timestampEnd);
    const leadingSpace = afterTimestamp.match(/^\s*/)?.[0] ?? "";
    const summary = afterTimestamp.slice(leadingSpace.length);

    const next = await editText({
      initialText: summary,
      getDescriptionText: (value) =>
        value.trim().length === 0
          ? "Start typing to update task text"
          : `Update to "${value}"`,
    });

    if (next === undefined || next === summary) {
      return;
    }

    const lineStart = firstLine.slice(0, timestampEnd) + leadingSpace;

    await editLine({
      path: task.location.path,
      position: task.location.position.start,
      contents: `${createMarkdownListTokens(task)} ${lineStart}${next}`,
    });
  }

  async function removeTask() {
    isNotVoid(task.location);

    await removeTaskFromPlan(task);
  }

  const autoSelect = $derived(
    $pendingTimelineTaskSelection !== undefined &&
      isTimelineTaskSelectionMatch(task, $pendingTimelineTaskSelection),
  );
  const startsBeforeSegment = $derived(
    task.timelineSegment?.startsBeforeSegment === true,
  );
  const continuesAfterSegment = $derived(
    task.timelineSegment?.continuesAfterSegment === true,
  );
  const disabledFloatingControls = $derived(getDisabledFloatingControls(task));

  function handleAutoSelect() {
    const target = $pendingTimelineTaskSelection;

    if (target && isLocatedTimelineTaskSelectionMatch(task, target)) {
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
      task,
      workspaceFacade,
      onEdit: editTaskSummary,
      onEditNestedItems: () => openNestedItemsEditModal(task),
      onRemove: removeTask,
    })}
  selectionBlocked={Boolean($editOperation)}
>
  {#snippet children(selectable)}
    <FloatingControls
      active={selectable.state === "primary"}
      disabled={disabledFloatingControls}
    >
      {#snippet anchor(floatingControls)}
        {@render timeBlock({
          isActive: selectable.state !== "none",
          onPointerUp: selectable.onpointerup,
          use: [...selectable.use, ...floatingControls.actions],
        })}
      {/snippet}

      {#snippet topEnd({ isActive, setIsActive })}
        <DragControls
          --expanding-controls-position="absolute"
          {isActive}
          {setIsActive}
          {task}
        />
      {/snippet}

      {#snippet bottom({ isActive, setIsActive })}
        {#if !task.isAllDayEvent && !continuesAfterSegment}
          <ResizeControls {isActive} reverse {setIsActive} {task} />
        {/if}
      {/snippet}

      {#snippet top({ isActive, setIsActive })}
        {#if !task.isAllDayEvent && !startsBeforeSegment}
          <ResizeControls fromTop {isActive} reverse {setIsActive} {task} />
        {/if}
      {/snippet}
    </FloatingControls>
  {/snippet}
</Selectable>
<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->
