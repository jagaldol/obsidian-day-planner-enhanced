<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { get } from "svelte/store";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { currentTimeSignal, isToday } from "../../global-store/current-time";
  import { getVisibleHours, snap } from "../../global-store/derived-settings";
  import { selectLogEntriesForDay } from "../../redux";
  import type { Task, WithPlacing, WithTime } from "../../task-types";
  import {
    getClientOffsetY,
    getIsomorphicClientY,
    getPointerOffsetY,
    isTouchEvent,
    listenForAutoScrollPointerMove,
    offsetYToMinutes,
  } from "../../util/dom";
  import {
    getMinutesSinceMidnight,
    minutesToMomentOfDay,
  } from "../../util/moment";
  import type { Moment } from "../../util/obsidian-moment";
  import {
    getBlockProps,
    getDayKey,
    getEndMinutes,
    getRenderKey,
  } from "../../util/task-utils";
  import { createGestures } from "../actions/gestures";
  import {
    getDragPointerDateTime,
    shouldUpdateDateTimePointer,
    withDragScrollOffset,
  } from "../hooks/use-edit/drag-pointer";
  import type { EditOperation } from "../hooks/use-edit/types";

  import Column from "./column.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import Needle from "./needle.svelte";
  import PositionedTimeBlock from "./positioned-time-block.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const {
    day,
    autoScrollBlocked = false,
  }: { autoScrollBlocked?: boolean; day: Moment } = $props();

  const {
    settings,
    editContext: {
      confirmEdit,
      handlers: { handleContainerMouseDown },
      getDisplayedTasksForTimeline,
      editOperation,
    },
    pointerDateTime,
    settingsSignal,
    useSelector,
  } = getObsidianContext();

  const displayedTasksForTimeline = $derived(getDisplayedTasksForTimeline(day));
  const dayKey = $derived(getDayKey(day));

  const logEntriesForDay = useSelector((state) =>
    selectLogEntriesForDay(state, dayKey, currentTimeSignal.current),
  );

  interface SeparatorVisibility {
    showBottomSeparator: boolean;
    showTopSeparator: boolean;
  }

  function createSeparatorVisibilityLookup(
    tasks: Array<WithPlacing<WithTime<Task>>>,
  ) {
    const separatorVisibilityByRenderKey = new Map<
      string,
      SeparatorVisibility
    >();
    const tasksByStartMinute = new Map<
      number,
      Array<WithPlacing<WithTime<Task>>>
    >();

    tasks.forEach((task) => {
      const startMinute = getMinutesSinceMidnight(task.startTime);
      const tasksStartingAtMinute = tasksByStartMinute.get(startMinute) ?? [];

      tasksStartingAtMinute.push(task);
      tasksByStartMinute.set(startMinute, tasksStartingAtMinute);

      separatorVisibilityByRenderKey.set(getRenderKey(task), {
        showBottomSeparator: true,
        showTopSeparator: !startsOnTimelineGridLine(task),
      });
    });

    tasks.forEach((task) => {
      const nextTasks = tasksByStartMinute.get(getEndMinutes(task)) ?? [];
      const nextTaskCoveringTaskHorizontally = nextTasks.find((nextTask) =>
        coversHorizontalRange(nextTask, task),
      );

      if (
        nextTaskCoveringTaskHorizontally &&
        !startsOnTimelineGridLine(nextTaskCoveringTaskHorizontally)
      ) {
        const currentVisibility = separatorVisibilityByRenderKey.get(
          getRenderKey(task),
        );

        separatorVisibilityByRenderKey.set(getRenderKey(task), {
          showBottomSeparator: false,
          showTopSeparator: currentVisibility?.showTopSeparator ?? true,
        });
      }
    });

    return separatorVisibilityByRenderKey;
  }

  function coversHorizontalRange(
    candidate: WithPlacing<WithTime<Task>>,
    task: WithPlacing<WithTime<Task>>,
  ) {
    const epsilon = 0.0001;
    const candidateStart = candidate.placing.offsetPercent;
    const candidateEnd = candidateStart + candidate.placing.spanPercent;
    const taskStart = task.placing.offsetPercent;
    const taskEnd = taskStart + task.placing.spanPercent;

    return (
      candidateStart <= taskStart + epsilon && candidateEnd >= taskEnd - epsilon
    );
  }

  function startsOnTimelineGridLine(task: WithTime<Task>) {
    return getMinutesSinceMidnight(task.startTime) % 30 === 0;
  }

  const plannerSeparatorVisibility = $derived(
    createSeparatorVisibilityLookup($displayedTasksForTimeline.withTime),
  );
  const logEntrySeparatorVisibility = $derived(
    createSeparatorVisibilityLookup(logEntriesForDay.current),
  );

  let el: HTMLElement | undefined = $state();

  function setDateTimePointer(dateTime: Moment) {
    const previousPointerDateTime = get(pointerDateTime);

    if (shouldUpdateDateTimePointer(previousPointerDateTime, dateTime)) {
      pointerDateTime.set({ dateTime, type: "dateTime" });
    }
  }

  function updatePointerDateTime(event: MouseEvent | TouchEvent) {
    isNotVoid(el);

    const newOffsetY = snap(getPointerOffsetY(el, event), $settings);
    const minutesSinceMidnight = offsetYToMinutes(
      newOffsetY,
      settingsSignal.current.zoomLevel,
      settingsSignal.current.startHour,
    );
    const dateTime = minutesToMomentOfDay(
      minutesSinceMidnight,
      window.moment(day),
    );

    setDateTimePointer(dateTime);
  }

  function handleContainerPointerDown(event: MouseEvent | TouchEvent) {
    updatePointerDateTime(event);
    handleContainerMouseDown();
  }

  function updateDragPointerDateTime(
    clientY: number,
    operation: EditOperation,
  ) {
    isNotVoid(el);

    const dateTime = getDragPointerDateTime({
      clientY,
      day: window.moment(day),
      operation,
      settings: settingsSignal.current,
      timelineOffsetY: getClientOffsetY(el, clientY),
    });

    setDateTimePointer(dateTime);
  }

  function handleContainerPointerMove(event: MouseEvent | TouchEvent) {
    const currentEditOperation = get(editOperation);

    if (!currentEditOperation) {
      return;
    }

    updateDragPointerDateTime(
      getIsomorphicClientY(event),
      currentEditOperation,
    );
  }

  function updateDragPointerOnAutoScroll(node: HTMLElement) {
    return listenForAutoScrollPointerMove(node, ({ clientY, scrollDeltaY }) => {
      let currentEditOperation = get(editOperation);

      if (!currentEditOperation) {
        return;
      }

      const scrolledEditOperation = withDragScrollOffset(
        currentEditOperation,
        scrollDeltaY,
      );

      if (scrolledEditOperation !== currentEditOperation) {
        currentEditOperation = scrolledEditOperation;
        editOperation.set(currentEditOperation);
      }

      updateDragPointerDateTime(clientY, currentEditOperation);
    });
  }

  const timelineGestures = createGestures({
    onlongpress: (event) => {
      if (event.target !== el) {
        return;
      }

      handleContainerPointerDown(event);
    },
    onpanmove: handleContainerPointerMove,
    onpanend: confirmEdit,
    options: { mouseSupport: false },
  });
</script>

{#if $settings.timelineColumns.planner}
  <Column
    --timeline-column-z-index={$isToday(day) ? "6" : "auto"}
    visibleHours={getVisibleHours($settings)}
  >
    {#if $isToday(day)}
      <Needle {autoScrollBlocked} />
    {/if}

    <div
      bind:this={el}
      class="tasks absolute-stretch-x"
      onpointerdown={(event) => {
        if (isTouchEvent(event) || event.target !== el) {
          return;
        }

        handleContainerPointerDown(event);
      }}
      onpointermove={handleContainerPointerMove}
      onpointerup={confirmEdit}
      use:timelineGestures
      use:updateDragPointerOnAutoScroll
    >
      {#each $displayedTasksForTimeline.withTime as task (getRenderKey(task))}
        {@const separatorVisibility = plannerSeparatorVisibility.get(
          getRenderKey(task),
        )}
        <PositionedTimeBlock
          showBottomSeparator={separatorVisibility?.showBottomSeparator}
          showTopSeparator={separatorVisibility?.showTopSeparator}
          {task}
        >
          <UnscheduledTimeBlock {task}>
            {#snippet bottomDecoration()}
              {getBlockProps(task, settingsSignal.current)}
            {/snippet}
          </UnscheduledTimeBlock>
        </PositionedTimeBlock>
      {/each}
    </div>
  </Column>
{/if}

{#if $settings.timelineColumns.timeTracker}
  <Column
    --timeline-column-z-index={$isToday(day) ? "6" : "auto"}
    visibleHours={getVisibleHours($settings)}
  >
    {#if $isToday(day)}
      <Needle {autoScrollBlocked} />
    {/if}

    <div class="tasks absolute-stretch-x">
      {#each logEntriesForDay.current as task (task.id)}
        {@const separatorVisibility = logEntrySeparatorVisibility.get(
          getRenderKey(task),
        )}
        <PositionedTimeBlock
          showBottomSeparator={separatorVisibility?.showBottomSeparator}
          showTopSeparator={separatorVisibility?.showTopSeparator}
          {task}
        >
          <LocalTimeBlock {task}>
            {#snippet bottomDecoration()}
              {getBlockProps(task, settingsSignal.current)}
            {/snippet}
          </LocalTimeBlock>
        </PositionedTimeBlock>
      {/each}
    </div>
  </Column>
{/if}

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  .tasks {
    z-index: 2;
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-inline: 0;
  }

  .tasks :global(.planner-sticky-block-content) {
    position: sticky;
    top: 0;
    max-height: 100%;
  }
</style>
