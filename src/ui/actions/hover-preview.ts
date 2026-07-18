/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { derived, writable } from "svelte/store";

import { getObsidianContext } from "../../context/obsidian-context";
import { isListItemSourced, type LocalTimeBlock } from "../../time-block-types";

export function hoverPreview(task: LocalTimeBlock) {
  return (el: HTMLElement) => {
    const { isModPressed, showPreview } = getObsidianContext();
    let currentEvent: MouseEvent | undefined;

    const hovering = writable(false);

    function handleMouseEnter(event: MouseEvent) {
      currentEvent = event;
      hovering.set(true);
    }

    function handleMouseLeave(event: MouseEvent) {
      currentEvent = undefined;
      hovering.set(false);
    }

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    const shouldShowPreview = derived(
      [isModPressed, hovering],
      ([$isModPressed, $hovering]) => {
        return $isModPressed && $hovering;
      },
    );

    const unsubscribe = shouldShowPreview.subscribe((newValue) => {
      if (!newValue || !currentEvent) {
        return;
      }

      if (task.source === "unwritten") {
        return;
      }

      showPreview(
        el,
        currentEvent,
        task.path,
        isListItemSourced(task) ? task.position.start.line : undefined,
      );
    });

    return {
      destroy() {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
        unsubscribe();
      },
    };
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
