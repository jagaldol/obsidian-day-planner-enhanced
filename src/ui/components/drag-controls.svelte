<script lang="ts">
  import {
    FoldVertical,
    ArrowDownToLine,
    GripVertical,
    Copy,
  } from "lucide-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask } from "../../task-types";
  import { getIsomorphicClientY } from "../../util/dom";
  import * as t from "../../util/task-utils";
  import { createGestures } from "../actions/gestures";
  import { EditMode } from "../hooks/use-edit/types";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let isActive: boolean;
  export let setIsActive: (value: boolean) => void;
  export let task: LocalTask;
  let dragStarted = false;

  const {
    pointerDateTime,
    editContext: {
      handlers: { handleGripMouseDown },
    },
  } = getObsidianContext();

  function startDrag(
    event: MouseEvent | TouchEvent,
    dragTask: LocalTask,
    mode: EditMode,
  ) {
    if (dragStarted) {
      return;
    }

    dragStarted = true;
    const originStartTime = dragTask.startTime.clone();

    pointerDateTime.set({
      dateTime: originStartTime.clone(),
      type: "dateTime",
    });

    handleGripMouseDown(dragTask, mode, getIsomorphicClientY(event));
  }

  function handleMoveStart(event: MouseEvent | TouchEvent, mode: EditMode) {
    startDrag(event, task, mode);
  }

  function handleMove(event: MouseEvent | TouchEvent, mode: EditMode) {
    startDrag(event, task, mode);
  }

  function handleCopyStart(event: MouseEvent | TouchEvent) {
    startDrag(event, t.copy(task), EditMode.DRAG);
  }

  function handleCopy(event: MouseEvent | TouchEvent) {
    handleCopyStart(event);
  }
</script>

<ExpandingControls {isActive} {setIsActive}>
  {#snippet initial()}
    <BlockControlButton
      cursor="grab"
      label="Move block"
      use={[
        createGestures({
          onpanstart: (event) => handleMoveStart(event, EditMode.DRAG),
          onpanmove: (event) => handleMove(event, EditMode.DRAG),
        }),
      ]}
    >
      <GripVertical class="svg-icon" />
    </BlockControlButton>
  {/snippet}
  {#snippet expanded()}
    <BlockControlButton
      cursor="grab"
      label="Copy block"
      use={[
        createGestures({
          onpanstart: handleCopyStart,
          onpanmove: handleCopy,
        }),
      ]}
    >
      <Copy class="svg-icon" />
    </BlockControlButton>

    {#if !task.isAllDayEvent}
      <BlockControlButton
        cursor="grab"
        label="Move block and push neighboring blocks"
        use={[
          createGestures({
            onpanstart: (event) =>
              handleMoveStart(event, EditMode.DRAG_AND_SHIFT_OTHERS),
            onpanmove: (event) =>
              handleMove(event, EditMode.DRAG_AND_SHIFT_OTHERS),
          }),
        ]}
      >
        <ArrowDownToLine class="svg-icon" />
      </BlockControlButton>
      <BlockControlButton
        cursor="grab"
        label="Move block and shrink neighboring blocks"
        use={[
          createGestures({
            onpanstart: (event) =>
              handleMoveStart(event, EditMode.DRAG_AND_SHRINK_OTHERS),
            onpanmove: (event) =>
              handleMove(event, EditMode.DRAG_AND_SHRINK_OTHERS),
          }),
        ]}
      >
        <FoldVertical class="svg-icon" />
      </BlockControlButton>
    {/if}
  {/snippet}
</ExpandingControls>
