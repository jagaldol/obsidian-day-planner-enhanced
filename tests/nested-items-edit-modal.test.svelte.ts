import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { EditableNestedListItem } from "../src/service/list-item-entry-editor";
import type { RenderMarkdown } from "../src/types";
import NestedItemsEditModal from "../src/ui/components/nested-items-edit-modal.svelte";
import type { AttachMarkdownInputSuggest } from "../src/ui/markdown-input-suggest";

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
    attachInternalLinkHoverPreview?: (element: HTMLElement) => {
      destroy: () => void;
    };
    attachMarkdownInputSuggest?: AttachMarkdownInputSuggest;
    onEditEscape?: () => void;
    onEditStateChange?: (isEditing: boolean) => void;
    renderMarkdown?: RenderMarkdown;
    sourcePath?: string;
  } = {},
) {
  const target = document.createElement("div");
  const onSave = vi.fn();
  const onCancel = vi.fn();
  const renderMarkdown: RenderMarkdown =
    props.renderMarkdown ??
    ((element, markdown) => {
      element.textContent = markdown;

      return () => {};
    });

  document.body.appendChild(target);

  const component = mount(NestedItemsEditModal, {
    target,
    props: {
      attachInternalLinkHoverPreview:
        props.attachInternalLinkHoverPreview ??
        (() => ({
          destroy() {},
        })),
      attachMarkdownInputSuggest: props.attachMarkdownInputSuggest,
      initialItems,
      onEditEscape: props.onEditEscape,
      onEditStateChange: props.onEditStateChange,
      parentText: "11:30 - 13:40 오전 처리 및 셀프 정리",
      renderMarkdown,
      sourcePath: props.sourcePath ?? "Journal/2026-07-27.md",
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
  test("uses New item as a placeholder instead of a prefilled value", () => {
    const { component, target, onSave } = renderModal([]);

    try {
      click(target.querySelector("button.add-root-row"));

      const input = getInput();

      expect(input?.value).toBe("");
      expect(input?.placeholder).toBe("New item");

      (input as HTMLInputElement).value = "Review the timeline";
      input?.dispatchEvent(new Event("input", { bubbles: true }));
      flushSync();

      keydown(input, "Enter");
      click(target.querySelector("button.mod-cta"));

      expect(onSave).toHaveBeenCalledWith([
        {
          text: "Review the timeline",
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

  test("does not save an untouched new item", () => {
    const { component, target, onSave } = renderModal([]);

    try {
      click(target.querySelector("button.add-root-row"));
      click(target.querySelector("button.mod-cta"));

      expect(onSave).toHaveBeenCalledWith([]);
    } finally {
      unmount(component);
      target.remove();
    }
  });

  test("removes an untouched new item when its edit is canceled", () => {
    const { component, target } = renderModal([]);

    try {
      click(target.querySelector("button.add-root-row"));
      keydown(getInput(), "Escape");

      expect(target.querySelector(".nested-item-card")).toBeNull();
    } finally {
      unmount(component);
      target.remove();
    }
  });

  test("attaches markdown suggestions while an item is being edited", () => {
    const detach = vi.fn();
    const attachMarkdownInputSuggest = vi.fn(() => detach);
    const { component, target } = renderModal(
      [{ text: "Project task", symbol: "-" }],
      { attachMarkdownInputSuggest },
    );

    try {
      click(target.querySelector('button[aria-label="Edit Project task"]'));

      expect(attachMarkdownInputSuggest).toHaveBeenCalledWith(getInput());

      keydown(getInput(), "Escape");

      expect(detach).toHaveBeenCalledOnce();
    } finally {
      unmount(component);
      target.remove();
    }
  });

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

  test("renders inactive wikilinks and tags while keeping the rest editable", () => {
    const destroyMarkdown = vi.fn();
    const renderMarkdown = vi.fn<RenderMarkdown>(
      (element, markdown, sourcePath) => {
        expect(sourcePath).toBe("Journal/2026-07-27.md");
        element.textContent = "";

        if (markdown.includes("[[Project")) {
          element.append("Review ");

          const link = document.createElement("a");

          link.className = "internal-link";
          link.dataset.href = "Project#Plan";
          link.textContent = "plan";
          element.append(link, " ");

          const tag = document.createElement("a");

          tag.className = "tag";
          tag.textContent = "#focus";
          element.append(tag);
        } else {
          element.textContent = markdown;
        }

        return destroyMarkdown;
      },
    );
    const { component, target } = renderModal(
      [
        {
          text: "11:40 - 12:00 Review [[Project#Plan|plan]] #focus",
          symbol: "-",
        },
      ],
      { renderMarkdown },
    );

    try {
      const itemText = target.querySelector(".item-text");
      const link = target.querySelector(".item-text a.internal-link");
      const tag = target.querySelector(".item-text a.tag");

      expect(itemText?.textContent).toBe("Review plan #focus");
      expect(link?.textContent).toBe("plan");
      expect(tag?.textContent).toBe("#focus");
      expect(renderMarkdown).toHaveBeenCalledWith(
        itemText,
        "Review [[Project#Plan|plan]] #focus",
        "Journal/2026-07-27.md",
      );

      click(link);
      expect(getInput()).toBeNull();

      click(tag);
      expect(getInput()).toBeNull();

      click(
        target.querySelector(
          'button[aria-label="Edit Review [[Project#Plan|plan]] #focus"]',
        ),
      );
      expect(getInput()?.value).toBe(
        "11:40 - 12:00 Review [[Project#Plan|plan]] #focus",
      );
      expect(destroyMarkdown).toHaveBeenCalled();
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
