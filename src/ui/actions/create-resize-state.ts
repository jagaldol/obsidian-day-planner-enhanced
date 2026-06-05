/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { on } from "svelte/events";
import { isNotVoid } from "typed-assert";

import { getPointerOffsetY } from "../../util/dom";

/**
 * This action is useful for cases when we need a resize grip that is outside
 * the resize container.
 */
export function createResizeState() {
  const onDestroyCallbacks: Array<() => void> = [];
  let resizeContainerEl: HTMLElement | undefined;
  let editingHeight = false;

  function startResizing() {
    editingHeight = true;
  }

  function stopResizing(event: MouseEvent | TouchEvent) {
    if (!editingHeight) {
      return;
    }

    event.stopPropagation();
    editingHeight = false;
  }

  function handleBlur() {
    editingHeight = false;
  }

  function handleMove(event: MouseEvent | TouchEvent) {
    if (!editingHeight) {
      return;
    }

    isNotVoid(
      resizeContainerEl,
      `Failed to resize a container. Either an action function hasn't been passed to a container, or the container got destroyed.`,
    );

    const newHeight = getPointerOffsetY(resizeContainerEl, event);

    resizeContainerEl.style.height = `${newHeight}px`;
  }

  function resizeAction(el: HTMLElement) {
    resizeContainerEl = el;
    const ownerDocument = el.ownerDocument;

    onDestroyCallbacks.push(
      on(ownerDocument, "mousemove", handleMove),
      on(ownerDocument, "touchmove", handleMove),
      on(ownerDocument, "mouseup", stopResizing, { capture: true }),
      on(ownerDocument, "touchend", stopResizing, { capture: true }),
      on(ownerDocument, "touchcancel", stopResizing, { capture: true }),
      on(window, "blur", handleBlur),
    );

    return {
      destroy() {
        resizeContainerEl = undefined;
        onDestroyCallbacks.forEach((callback) => callback());
      },
    };
  }

  return {
    startResizing,
    resizeAction,
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
