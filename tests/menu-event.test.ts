import type { Menu } from "obsidian";
import { describe, expect, test, vi } from "vitest";

import { showMenuAtEvent } from "../src/ui/menu-event";

function createMenu() {
  return {
    showAtMouseEvent: vi.fn(),
    showAtPosition: vi.fn(),
  } as unknown as Menu;
}

describe("showMenuAtEvent", () => {
  test("shows mouse and pointer menus at the triggering event", () => {
    const menu = createMenu();
    const event = new MouseEvent("contextmenu", { clientX: 20, clientY: 30 });

    showMenuAtEvent(menu, event);

    expect(menu.showAtMouseEvent).toHaveBeenCalledOnce();
    expect(menu.showAtMouseEvent).toHaveBeenCalledWith(event);
    expect(menu.showAtPosition).not.toHaveBeenCalled();
  });

  test("shows touch menus at the changed touch position", () => {
    const menu = createMenu();
    const event = {
      touches: [],
      changedTouches: [{ clientX: 40, clientY: 50 }],
      view: window,
    } as unknown as TouchEvent;

    showMenuAtEvent(menu, event);

    expect(menu.showAtMouseEvent).not.toHaveBeenCalled();
    expect(menu.showAtPosition).toHaveBeenCalledOnce();
    expect(menu.showAtPosition).toHaveBeenCalledWith(
      { x: 40, y: 50 },
      document,
    );
  });

  test("does not show a touch menu without a usable touch point", () => {
    const menu = createMenu();
    const event = {
      touches: [],
      changedTouches: [],
      view: window,
    } as unknown as TouchEvent;

    showMenuAtEvent(menu, event);

    expect(menu.showAtMouseEvent).not.toHaveBeenCalled();
    expect(menu.showAtPosition).not.toHaveBeenCalled();
  });
});
