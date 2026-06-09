import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { EditableNestedListItem } from "../src/service/list-item-entry-editor";
import NestedItemsEditModal from "../src/ui/components/nested-items-edit-modal.svelte";

function click(element: Element | null) {
  expect(element).not.toBeNull();

  (element as HTMLElement).click();
  flushSync();
}

function keydown(element: Element | null, key: string) {
  expect(element).not.toBeNull();

  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key,
  });

  element?.dispatchEvent(event);
  flushSync();

  return event;
}

function windowKeydown(key: string) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key,
  });

  window.dispatchEvent(event);
  flushSync();

  return event;
}

function windowKeyup(key: string) {
  const event = new KeyboardEvent("keyup", {
    bubbles: true,
    cancelable: true,
    key,
  });

  window.dispatchEvent(event);
  flushSync();

  return event;
}

function getInput() {
  return document.querySelector<HTMLInputElement>(
    'input[aria-label="Nested item text"]',
  );
}

function renderModal(
  initialItems: EditableNestedListItem[],
  props: {
    onEditEscape?: () => void;
    onEditStateChange?: (isEditing: boolean) => void;
  } = {},
) {
  const target = document.createElement("div");
  const onSave = vi.fn();
  const onCancel = vi.fn();

  document.body.appendChild(target);

  const component = mount(NestedItemsEditModal, {
    target,
    props: {
      initialItems,
      onEditEscape: props.onEditEscape,
      onEditStateChange: props.onEditStateChange,
      parentText: "11:30 - 13:40 오전 처리 및 셀프 정리",
      onSave,
      onCancel,
    },
  });

  flushSync();

  return { component, target, onSave, onCancel };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("NestedItemsEditModal", () => {
  test("enters edit mode when clicking the displayed text area", () => {
    const { component, target } = renderModal([
      { text: "11:40 - 12:00 레이저 제모", symbol: "-" },
    ]);

    try {
      click(target.querySelector('button[aria-label="Edit 레이저 제모"]'));

      expect(getInput()?.value).toBe("11:40 - 12:00 레이저 제모");
    } finally {
      unmount(component);
      target.remove();
    }
  });

  test("keeps checkbox marker clicks out of edit mode", () => {
    const { component, target, onSave } = renderModal([
      { text: "New item", symbol: "-", task: " " },
    ]);

    try {
      click(target.querySelector('button[aria-label="Mark complete"]'));

      expect(getInput()).toBeNull();

      click(target.querySelector("button.mod-cta"));

      expect(onSave).toHaveBeenCalledWith([
        {
          text: "New item",
          symbol: "-",
          status: undefined,
          task: "x",
          children: [],
        },
      ]);
    } finally {
      unmount(component);
      target.remove();
    }
  });

  test("does not render a separate pencil edit action", () => {
    const { component, target } = renderModal([
      { text: "New item", symbol: "-" },
    ]);

    try {
      expect(target.querySelector('button[aria-label="Edit"]')).toBeNull();
      expect(
        target.querySelector('button[aria-label="Add child"]'),
      ).not.toBeNull();
      expect(
        target.querySelector('button[aria-label="Edit New item"]'),
      ).not.toBeNull();
    } finally {
      unmount(component);
      target.remove();
    }
  });

  test("applies the open edit before switching rows from a text click", () => {
    const { component, target, onSave } = renderModal([
      { text: "First item", symbol: "-" },
      { text: "Second item", symbol: "-" },
    ]);

    try {
      click(target.querySelector('button[aria-label="Edit First item"]'));

      const input = getInput();

      expect(input).not.toBeNull();

      (input as HTMLInputElement).value = "Updated first item";
      input?.dispatchEvent(new Event("input", { bubbles: true }));
      flushSync();

      click(target.querySelector('button[aria-label="Edit Second item"]'));
      click(target.querySelector("button.mod-cta"));

      expect(onSave).toHaveBeenCalledWith([
        {
          text: "Updated first item",
          symbol: "-",
          status: undefined,
          task: undefined,
          children: [],
        },
        {
          text: "Second item",
          symbol: "-",
          status: undefined,
          task: undefined,
          children: [],
        },
      ]);
    } finally {
      unmount(component);
      target.remove();
    }
  });

  test("Escape cancels the active row edit without closing the modal", () => {
    const { component, target, onSave, onCancel } = renderModal([
      { text: "Verify markdown output", symbol: "-" },
    ]);

    try {
      click(
        target.querySelector(
          'button[aria-label="Edit Verify markdown output"]',
        ),
      );

      const input = getInput();

      expect(input).not.toBeNull();

      (input as HTMLInputElement).value = "Changed draft";
      input?.dispatchEvent(new Event("input", { bubbles: true }));
      flushSync();

      const event = keydown(input, "Escape");

      expect(event.defaultPrevented).toBe(true);
      expect(getInput()).toBeNull();
      expect(onCancel).not.toHaveBeenCalled();

      click(target.querySelector("button.mod-cta"));

      expect(onSave).toHaveBeenCalledWith([
        {
          text: "Verify markdown output",
          symbol: "-",
          status: undefined,
          task: undefined,
          children: [],
        },
      ]);
    } finally {
      unmount(component);
      target.remove();
    }
  });

  test("Escape is captured before modal-level close handlers while editing", () => {
    const onEditEscape = vi.fn();
    const { component, target } = renderModal(
      [{ text: "Implementation block", symbol: "-" }],
      { onEditEscape },
    );
    const modalCloseKeydownHandler = vi.fn();
    const modalCloseKeyupHandler = vi.fn();

    window.addEventListener("keydown", modalCloseKeydownHandler, true);
    window.addEventListener("keyup", modalCloseKeyupHandler, true);

    try {
      click(
        target.querySelector('button[aria-label="Edit Implementation block"]'),
      );

      const keydownEvent = windowKeydown("Escape");
      const keyupEvent = windowKeyup("Escape");

      expect(keydownEvent.defaultPrevented).toBe(true);
      expect(keyupEvent.defaultPrevented).toBe(true);
      expect(onEditEscape).toHaveBeenCalledOnce();
      expect(modalCloseKeydownHandler).not.toHaveBeenCalled();
      expect(modalCloseKeyupHandler).not.toHaveBeenCalled();
      expect(getInput()).toBeNull();
    } finally {
      window.removeEventListener("keydown", modalCloseKeydownHandler, true);
      window.removeEventListener("keyup", modalCloseKeyupHandler, true);
      unmount(component);
      target.remove();
    }
  });

  test("reports active edit state changes", () => {
    const onEditStateChange = vi.fn();
    const { component, target } = renderModal(
      [{ text: "Implementation block", symbol: "-" }],
      { onEditStateChange },
    );

    try {
      expect(onEditStateChange).toHaveBeenLastCalledWith(false);

      click(
        target.querySelector('button[aria-label="Edit Implementation block"]'),
      );

      expect(onEditStateChange).toHaveBeenLastCalledWith(true);

      windowKeydown("Escape");

      expect(onEditStateChange).toHaveBeenLastCalledWith(false);
    } finally {
      unmount(component);
      target.remove();
    }
  });
});
