import { afterEach, describe, expect, test, vi } from "vitest";

import { createResizeState } from "../src/ui/actions/create-resize-state";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe("createResizeState", () => {
  test("caps the requested height at the provided content height", () => {
    vi.stubGlobal("PointerEvent", MouseEvent);

    const container = document.createElement("div");
    container.style.maxHeight = "16vh";
    document.body.appendChild(container);
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      top: 10,
    } as DOMRect);

    const resizeState = createResizeState({ getMaxHeight: () => 120 });
    const action = resizeState.resizeAction(container);

    resizeState.startResizing();
    expect(container.style.maxHeight).toBe("16vh");
    expect(container.classList.contains("is-manually-resized")).toBe(false);

    document.dispatchEvent(new MouseEvent("mousemove", { clientY: 90 }));
    expect(container.style.maxHeight).toBe("16vh");
    expect(container.classList.contains("is-manually-resized")).toBe(true);
    expect(container.style.height).toBe("80px");

    document.dispatchEvent(new MouseEvent("mousemove", { clientY: 210 }));
    expect(container.style.height).toBe("120px");

    resizeState.resetHeight();
    expect(container.classList.contains("is-manually-resized")).toBe(false);
    expect(container.style.height).toBe("");

    document.dispatchEvent(new MouseEvent("mousemove", { clientY: 100 }));
    expect(container.style.height).toBe("");

    action.destroy();
  });
});
