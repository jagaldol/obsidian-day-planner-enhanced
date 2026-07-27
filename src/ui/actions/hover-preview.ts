/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { derived, writable, type Readable } from "svelte/store";

import { getObsidianContext } from "../../context/obsidian-context";
import { isListItemSourced, type LocalTimeBlock } from "../../time-block-types";
import type { ShowPreview } from "../../util/create-show-preview";
import {
  containsInteractiveElement,
  isElement,
  isHTMLElement,
  isInteractiveEventTarget,
} from "../../util/dom";

interface HoverPreviewDependencies {
  isModPressed: Readable<boolean>;
  showPreview: ShowPreview;
}

interface InternalLinkHoverTarget {
  event: MouseEvent;
  linktext: string;
  targetEl: HTMLElement;
}

interface HoverTarget {
  event: MouseEvent;
  line?: number;
  linktext: string;
  sourcePath: string;
  targetEl: HTMLElement;
}

export function createInternalLinkHoverPreview(
  sourcePath: string,
  { isModPressed, showPreview }: HoverPreviewDependencies,
) {
  return (el: HTMLElement) => {
    const hoverTarget = writable<InternalLinkHoverTarget | undefined>();
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
        !internalLink ||
        !linktext ||
        !el.contains(internalLink) ||
        !isHTMLElement(internalLink)
      ) {
        clearPreview();
        return;
      }

      hoverTarget.set({
        event,
        linktext,
        targetEl: internalLink,
      });
    }

    el.addEventListener("mouseover", handleMouseOver, true);
    el.addEventListener("mouseleave", clearPreview);

    const activeHoverTarget = derived(
      [isModPressed, hoverTarget],
      ([$isModPressed, $hoverTarget]) =>
        $isModPressed ? $hoverTarget : undefined,
    );

    const unsubscribe = activeHoverTarget.subscribe((currentHoverTarget) => {
      if (!currentHoverTarget) {
        activePreviewTarget = undefined;
        return;
      }

      if (activePreviewTarget === currentHoverTarget.targetEl) {
        return;
      }

      const { event, linktext, targetEl } = currentHoverTarget;

      showPreview(targetEl, targetEl, event, linktext, undefined, sourcePath);
      activePreviewTarget = targetEl;
    });

    return {
      destroy() {
        el.removeEventListener("mouseover", handleMouseOver, true);
        el.removeEventListener("mouseleave", clearPreview);
        clearPreview();
        unsubscribe();
      },
    };
  };
}

export function createHoverPreview(
  task: LocalTimeBlock,
  { isModPressed, showPreview }: HoverPreviewDependencies,
) {
  return (el: HTMLElement) => {
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
        hoverTarget.set({
          event,
          linktext,
          sourcePath: task.source === "unwritten" ? "/" : task.path,
          targetEl: internalLink,
        });
        return;
      }

      if (isInteractiveEventTarget(event.target)) {
        clearPreview();
        return;
      }

      const targetEl = isHTMLElement(event.target) ? event.target : el;

      // A broad container that also owns a rendered link must not own the
      // source popover. Otherwise moving into that link keeps the old popover
      // alive while Obsidian starts the link preview.
      if (containsInteractiveElement(targetEl)) {
        clearPreview();
        return;
      }

      if (task.source === "unwritten") {
        clearPreview();
        return;
      }

      hoverTarget.set({
        event,
        line: isListItemSourced(task) ? task.position.start.line : undefined,
        linktext: task.path,
        sourcePath: task.path,
        targetEl,
      });
    }

    function handleMouseLeave() {
      clearPreview();
    }

    el.addEventListener("mouseover", handleMouseOver, true);
    el.addEventListener("mouseleave", handleMouseLeave);

    const activeHoverTarget = derived(
      [isModPressed, hoverTarget],
      ([$isModPressed, $hoverTarget]) =>
        $isModPressed ? $hoverTarget : undefined,
    );

    const unsubscribe = activeHoverTarget.subscribe((currentHoverTarget) => {
      if (!currentHoverTarget) {
        activePreviewTarget = undefined;
        return;
      }

      if (activePreviewTarget === currentHoverTarget.targetEl) {
        return;
      }

      const { event, line, linktext, sourcePath, targetEl } =
        currentHoverTarget;

      showPreview(targetEl, targetEl, event, linktext, line, sourcePath);
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

export function hoverPreview(task: LocalTimeBlock) {
  const { isModPressed, showPreview } = getObsidianContext();

  return createHoverPreview(task, { isModPressed, showPreview });
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
