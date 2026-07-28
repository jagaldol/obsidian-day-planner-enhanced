import { createRawSnippet, flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, test } from "vitest";

import FloatingUi from "../src/ui/components/floating-ui.svelte";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("FloatingUi", () => {
  test("stays inside its timeline DOM hierarchy", () => {
    const target = document.createElement("div");
    const children = createRawSnippet(() => ({
      render: () => "<span>Control</span>",
    }));

    document.body.appendChild(target);

    const component = mount(FloatingUi, {
      props: { children },
      target,
    });

    flushSync();

    const floatingUi = target.querySelector(".floating-ui");

    expect(floatingUi?.parentElement).toBe(target);
    expect(floatingUi?.textContent).toBe("Control");

    unmount(component);
  });
});
