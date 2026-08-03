import type { Menu } from "obsidian";

export type MenuTriggerEvent = MouseEvent | PointerEvent | TouchEvent;

export function showMenuAtEvent(menu: Menu, event: MenuTriggerEvent) {
  if (!("touches" in event)) {
    menu.showAtMouseEvent(event);

    return;
  }

  const touch = event.changedTouches[0] ?? event.touches[0];

  if (!touch) {
    return;
  }

  menu.showAtPosition(
    { x: touch.clientX, y: touch.clientY },
    event.view?.document,
  );
}
