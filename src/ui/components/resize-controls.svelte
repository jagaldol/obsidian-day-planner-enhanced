<script lang="ts">
  import { ArrowDownToLine, MoveVertical, FoldVertical } from "lucide-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { EditableTimeBlock } from "../../time-block-types";
  import { getIsomorphicClientY } from "../../util/dom";
  import { createGestures } from "../actions/gestures";
  import {
    getRelativePointerDateTime,
    getResizeStartState,
  } from "../hooks/use-edit/drag-pointer";
  import { EditMode } from "../hooks/use-edit/types";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let timeBlock: EditableTimeBlock;
  export let isActive: boolean;
  export let setIsActive: (value: boolean) => void;
  export let reverse: boolean | undefined = false;
  export let fromTop: boolean | undefined = false;
  let resizeStarted = false;
  let pendingResizeStartState:
    | ReturnType<typeof getResizeStartState>
    | undefined;

  const {
    pointerDateTime,
    settingsSignal,
    editContext: {
      handlers: { handleResizerMouseDown },
    },
  } = getObsidianContext();

  function getCurrentResizeStartState(event: MouseEvent | TouchEvent) {
    return getResizeStartState(
      timeBlock,
      getIsomorphicClientY(event),
      fromTop === true,
    );
  }

  function prepareResize(event: MouseEvent | TouchEvent) {
    pendingResizeStartState = getCurrentResizeStartState(event);
  }

  function startResize(event: MouseEvent | TouchEvent, mode: EditMode) {
    if (resizeStarted) {
      return;
    }

    resizeStarted = true;
    const resizeStartState =
      pendingResizeStartState ?? getCurrentResizeStartState(event);

    pointerDateTime.set({
      dateTime: getRelativePointerDateTime({
        clientY: getIsomorphicClientY(event),
        day: timeBlock.startTime,
        dragOriginClientY: resizeStartState.dragOriginClientY,
        dragOriginMinutes: resizeStartState.dragOriginMinutes,
        settings: settingsSignal.current,
      }),
      type: "dateTime",
    });

    handleResizerMouseDown(
      timeBlock,
      mode,
      resizeStartState.dragOriginClientY,
      resizeStartState.dragOriginMinutes,
    );
  }

  function createResizeGesture(mode: EditMode) {
    return createGestures({
      onpanstart: prepareResize,
      onpanmove: (event) => startResize(event, mode),
    });
  }
</script>

<ExpandingControls {isActive} {reverse} {setIsActive}>
  {#snippet initial()}
    <BlockControlButton
      cursor="grab"
      label="Resize block"
      use={[
        createResizeGesture(
          fromTop ? EditMode.RESIZE_FROM_TOP : EditMode.RESIZE,
        ),
      ]}
    >
      <MoveVertical class="svg-icon" />
    </BlockControlButton>
  {/snippet}
  {#snippet expanded()}
    <BlockControlButton
      cursor="grab"
      label="Resize block and push neighboring blocks"
      use={[
        createResizeGesture(
          fromTop
            ? EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS
            : EditMode.RESIZE_AND_SHIFT_OTHERS,
        ),
      ]}
    >
      <ArrowDownToLine class="svg-icon" />
    </BlockControlButton>
    <BlockControlButton
      cursor="grab"
      label="Resize block and shrink neighboring blocks"
      use={[
        createResizeGesture(
          fromTop
            ? EditMode.RESIZE_FROM_TOP_AND_SHRINK_OTHERS
            : EditMode.RESIZE_AND_SHRINK_OTHERS,
        ),
      ]}
    >
      <FoldVertical class="svg-icon" />
    </BlockControlButton>
  {/snippet}
</ExpandingControls>
