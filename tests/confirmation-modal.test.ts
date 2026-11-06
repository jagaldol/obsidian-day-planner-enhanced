import type { App } from "obsidian";
import { expect, test, vi } from "vitest";

const { modals } = vi.hoisted(() => ({
  modals: [] as { close: () => void; contentEl: HTMLElement }[],
}));
vi.mock("obsidian", () => {
  function element() {
    const el = document.createElement("div");
    const methods = {
      addClass: (name: string) => el.classList.add(name),
      createEl: (tag: string, options: { text: string; cls?: string }) => {
        const child = document.createElement(tag);
        child.textContent = options.text;
        if (options.cls) child.className = options.cls;
        el.append(child);
        return child;
      },
      createDiv: (_name: string, callback: (child: HTMLElement) => void) => {
        const child = element();
        el.append(child);
        callback(child);
        return child;
      },
    };
    for (const [key, value] of Object.entries(methods))
      Object.defineProperty(el, key, { value, configurable: true });
    return el;
  }
  return {
    App: class {},
    Modal: class {
      modalEl = element();
      contentEl = element();
      constructor() {
        modals.push(this);
      }
      open() {}
      close() {
        this.onClose();
      }
      onClose() {}
    },
  };
});

import { askForConfirmation } from "../src/ui/confirmation-modal";

test.each(["dismiss", "cancel", "accept"])(
  "settles confirmation on %s",
  async (action) => {
    const result = askForConfirmation({
      app: {} as App,
      title: "Create?",
      text: "Duplicates may occur",
      cta: "Create early",
    });
    const modal = modals.at(-1)!;
    if (action === "dismiss") modal.close();
    else
      modal.contentEl
        .querySelectorAll("button")
        [action === "cancel" ? 0 : 1]!.click();
    await expect(result).resolves.toBe(action === "accept");
  },
);
