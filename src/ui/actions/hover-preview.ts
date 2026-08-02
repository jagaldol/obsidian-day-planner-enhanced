/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { HoverParent } from "obsidian";
import { derived, writable } from "svelte/store";

import { getObsidianContext } from "../../context/obsidian-context";
import { isListItemSourced, type LocalTimeBlock } from "../../time-block-types";
import type { ShowPreview } from "../../util/create-show-preview";
import {
  isElement,
  isHTMLElement,
  isInteractiveEventTarget,
} from "../../util/dom";

interface HoverPreviewDependencies {
  showPreview: ShowPreview;
}

interface InternalLinkHoverPreviewDependencies {
  showPreview: ShowPreview;
}

interface HoverTarget {
  event: MouseEvent;
  line?: number;
  linktext: string;
  sourcePath: string;
  targetEl: HTMLElement;
}

function createLinkPreviewEvent(event: MouseEvent) {
  return new MouseEvent(event.type, {
    altKey: event.altKey,
    bubbles: event.bubbles,
    button: event.button,
    buttons: event.buttons,
    cancelable: event.cancelable,
    clientX: event.clientX,
    clientY: event.clientY,
    composed: event.composed,
    ctrlKey: event.ctrlKey,
    detail: event.detail,
    metaKey: event.metaKey,
    screenX: event.screenX,
    screenY: event.screenY,
    shiftKey: event.shiftKey,
    view: event.view,
  });
}

export function createInternalLinkHoverPreview(
  sourcePath: string,
  { showPreview }: InternalLinkHoverPreviewDependencies,
) {
  return (el: HTMLElement) => {
    const hoverParent: HoverParent = { hoverPopover: null };

    function handleMouseOver(event: MouseEvent) {
      const internalLink = isElement(event.target)
        ? event.target.closest("a.internal-link")
        : null;
      const linktext = internalLink?.getAttribute("data-href");

      if (
        !internalLink ||
        !linktext ||
        !el.contains(internalLink) ||
        !isHTMLElement(internalLink)
      ) {
        return;
      }

      showPreview(
        hoverParent,
        internalLink,
        createLinkPreviewEvent(event),
        linktext,
        undefined,
        sourcePath,
      );
      event.stopPropagation();
    }

    el.addEventListener("mouseover", handleMouseOver, true);

    return {
      destroy() {
        el.removeEventListener("mouseover", handleMouseOver, true);
      },
    };
  };
}

export function createHoverPreview(
  task: LocalTimeBlock,
  { showPreview }: HoverPreviewDependencies,
) {
  return (el: HTMLElement) => {
    const hoverParent: HoverParent = { hoverPopover: null };
    const hoverTarget = writable<HoverTarget | undefined>();
    let activePreviewTarget: HTMLElement | undefined;

    function clearPreview() {
      hoverTarget.set(undefined);
    }

    function handleMouseOver(event: MouseEvent) {
      const internalLink = isElement(event.target)
        ? event.target.closest("a.internal-link")
        : null;
      const linktext = internalLink?.getAttribute("data-href");

      if (
        internalLink &&
        linktext &&
        el.contains(internalLink) &&
        isHTMLElement(internalLink)
      ) {
        clearPreview();
        showPreview(
          hoverParent,
          internalLink,
          createLinkPreviewEvent(event),
          linktext,
          undefined,
          task.source === "unwritten" ? "/" : task.path,
        );
        event.stopPropagation();
        return;
      }

      if (task.isAllDayEvent || isInteractiveEventTarget(event.target)) {
        clearPreview();
        return;
      }

      const timeRange = isElement(event.target)
        ? event.target.closest(".time-block-range")
        : null;

      if (
        !timeRange ||
        !el.contains(timeRange) ||
        !isHTMLElement(timeRange) ||
        task.source === "unwritten"
      ) {
        clearPreview();
        return;
      }

      hoverTarget.set({
        event,
        line: isListItemSourced(task) ? task.position.start.line : undefined,
        linktext: task.path,
        sourcePath: task.path,
        targetEl: timeRange,
      });
    }

    function handleMouseLeave() {
      clearPreview();
    }

    el.addEventListener("mouseover", handleMouseOver, true);
    el.addEventListener("mouseleave", handleMouseLeave);

    const unsubscribe = hoverTarget.subscribe((currentHoverTarget) => {
      if (!currentHoverTarget) {
        activePreviewTarget = undefined;
        return;
      }

      if (activePreviewTarget === currentHoverTarget.targetEl) {
        return;
      }

      const { event, line, linktext, sourcePath, targetEl } =
        currentHoverTarget;

      showPreview(hoverParent, targetEl, event, linktext, line, sourcePath);
      activePreviewTarget = targetEl;
    });

    return {
      destroy() {
        el.removeEventListener("mouseover", handleMouseOver, true);
        el.removeEventListener("mouseleave", handleMouseLeave);
        clearPreview();
        unsubscribe();
      },
    };
  };
}

export function hoverPreview(timeBlock: LocalTimeBlock) {
  const { isModPressed, showPreview } = getObsidianContext();
  const enhancedPreview = createHoverPreview(timeBlock, { showPreview });

  return (el: HTMLElement) => {
    const enhancedAction = enhancedPreview(el);
    const hoverParent: HoverParent = { hoverPopover: null };
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
      ([$isModPressed, $hovering]) => $isModPressed && $hovering,
    );

    const unsubscribe = shouldShowPreview.subscribe((shouldShow) => {
      if (!shouldShow || !currentEvent || timeBlock.source === "unwritten") {
        return;
      }

      showPreview(
        hoverParent,
        el,
        currentEvent,
        timeBlock.path,
        isListItemSourced(timeBlock)
          ? timeBlock.position.start.line
          : undefined,
      );
    });

    return {
      destroy() {
        enhancedAction.destroy();
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
        unsubscribe();
      },
    };
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
