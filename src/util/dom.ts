/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { sanitizeHTMLToDom } from "obsidian";

import {
  scrollOnHoverZoneHeightPercent,
  scrollSpeedPixelsPerAnimationFrame,
} from "../constants";

export function isHTMLElement(value: unknown): value is HTMLElement {
  if (!value || typeof value !== "object") {
    return false;
  }

  const node = value as Node;

  if (typeof node.instanceOf === "function") {
    return node.instanceOf(HTMLElement);
  }

  return (
    value instanceof (node.ownerDocument?.defaultView ?? window).HTMLElement
  );
}

export function isTouchEvent(event: PointerEvent) {
  return ["pen", "touch"].includes(event.pointerType);
}

export function getIsomorphicClientY(
  event: PointerEvent | MouseEvent | TouchEvent,
) {
  if (event instanceof PointerEvent || event instanceof MouseEvent) {
    return event.clientY;
  }

  const firstTouch = event.touches[0];

  return firstTouch.pageY;
}

export function isEventRelated(
  event: PointerEvent,
  otherNode: HTMLElement | null,
) {
  if (!otherNode) {
    return false;
  }

  return (
    event.relatedTarget &&
    (event.relatedTarget === otherNode ||
      (event.relatedTarget instanceof Node &&
        otherNode.contains(event.relatedTarget)))
  );
}

export function isEventOutside(
  event: PointerEvent,
  container: HTMLElement | null,
) {
  if (!container) {
    return false;
  }

  return (
    event.target !== container &&
    event.target instanceof Node &&
    !container.contains(event.target)
  );
}

export function mountSanitized(el: HTMLElement, html: string) {
  if (!html) {
    return;
  }

  el.empty();

  const fragment = sanitizeHTMLToDom(html);

  el.appendChild(fragment);
}

export function offsetYToMinutes(
  offsetY: number,
  zoomLevel: number,
  startHour: number,
) {
  const hiddenHoursSize = startHour * 60 * zoomLevel;

  return (offsetY + hiddenHoursSize) / zoomLevel;
}

export function getDarkModeFlag() {
  return activeDocument.body.hasClass("theme-dark");
}

export function getPointerOffsetY(
  el: HTMLElement,
  event: MouseEvent | TouchEvent,
) {
  const viewportToElOffsetY = el.getBoundingClientRect().top;

  return getIsomorphicClientY(event) - viewportToElOffsetY;
}

export function getScrollZones(
  event: MouseEvent | TouchEvent,
  el: HTMLElement,
) {
  const pointerOffsetY = getPointerOffsetY(el, event);

  const isInTopScrollZone =
    (el.clientHeight / 100) * scrollOnHoverZoneHeightPercent >= pointerOffsetY;
  const isInBottomScrollZone =
    (el.clientHeight / 100) * (100 - scrollOnHoverZoneHeightPercent) <=
    pointerOffsetY;

  return { isInBottomScrollZone, isInTopScrollZone };
}

type ScrollDirection = "up" | "down";
type ScrollProps = { el: HTMLElement; direction: ScrollDirection };

export function createAutoScroll() {
  let scrolling = false;

  function stopScroll() {
    scrolling = false;
  }

  function scroll(props: ScrollProps) {
    const { el, direction } = props;

    window.requestAnimationFrame(() => {
      if (!scrolling) {
        return;
      }

      if (direction === "up") {
        el.scrollTop -= scrollSpeedPixelsPerAnimationFrame;
      } else if (direction === "down") {
        el.scrollTop += scrollSpeedPixelsPerAnimationFrame;
      }

      scroll(props);
    });
  }

  function startScroll(props: ScrollProps) {
    if (scrolling) {
      return;
    }

    scrolling = true;

    scroll(props);
  }

  return { startScroll, stopScroll };
}

export const checkboxInRenderedMarkdownSelector =
  '[data-task] input[type="checkbox"]';

export function addLineDataToCheckboxes(
  el: HTMLElement,
  taskLines: Array<number | undefined>,
) {
  if (!taskLines) {
    return;
  }

  el.querySelectorAll(checkboxInRenderedMarkdownSelector).forEach(
    (checkbox, i) => {
      const taskLine = taskLines[i];

      if (!isHTMLElement(checkbox) || !taskLine) {
        return;
      }

      checkbox.dataset.line = String(taskLine);
    },
  );
}

export async function readCheckboxLineData(
  event: PointerEvent,
  checkFn: (line: number) => Promise<void>,
) {
  if (!isHTMLElement(event.target)) {
    return;
  }

  const line = event.target.dataset.line;

  if (!line) {
    return;
  }

  event.stopPropagation();

  await checkFn(Number(line));
}
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
