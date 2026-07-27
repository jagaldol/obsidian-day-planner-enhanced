import type { App, TFile } from "obsidian";
import { describe, expect, test, vi } from "vitest";

import { SingleSuggestModal } from "../src/ui/SingleSuggestModal";

function createApp() {
  const files = [
    { basename: "Project Alpha", path: "Projects/Project Alpha.md" },
    { basename: "Today", path: "fixtures/daily/Today.md" },
  ] as TFile[];

  return {
    metadataCache: {
      fileToLinktext: (file: TFile) => file.basename,
      getFirstLinkpathDest: (linkpath: string) =>
        files.find((file) => file.basename === linkpath) ?? null,
      getFileCache: (file: TFile) => ({
        headings:
          file.path === "Projects/Project Alpha.md"
            ? [{ heading: "Overview", level: 1 }]
            : [{ heading: "Daily overview", level: 1 }],
        tags: [{ tag: "#project/alpha" }],
      }),
    },
    vault: {
      getFileByPath: (path: string) =>
        files.find((file) => file.path === path) ?? null,
      getMarkdownFiles: () => files,
    },
  } as unknown as App;
}

function createModal() {
  const onChooseSuggestion = vi.fn();
  const onClose = vi.fn();
  const modal = new SingleSuggestModal({
    app: createApp(),
    getDescriptionText: (value) => `Update to ${value}`,
    onChooseSuggestion,
    onClose,
    sourcePath: "fixtures/daily/Today.md",
  });

  return { modal, onChooseSuggestion, onClose };
}

describe("SingleSuggestModal", () => {
  test("offers markdown candidates while preserving the normal confirmation", () => {
    const { modal } = createModal();

    modal.inputEl.value = "Review [[Project";
    modal.inputEl.setSelectionRange(16, 16);

    expect(modal.getSuggestions(modal.inputEl.value)).toEqual([
      expect.objectContaining({
        kind: "wikilink",
        value: "Project Alpha",
      }),
      expect.objectContaining({
        isNew: true,
        kind: "wikilink",
        value: "Project",
      }),
    ]);

    modal.inputEl.value = "Review complete";
    modal.inputEl.setSelectionRange(15, 15);

    expect(modal.getSuggestions(modal.inputEl.value)).toEqual([
      { kind: "confirm", text: "Review complete" },
    ]);
  });

  test("inserts a markdown suggestion without confirming the edit", () => {
    const { modal, onChooseSuggestion } = createModal();
    const close = vi.spyOn(modal, "close");

    modal.inputEl.value = "Review [[Project";
    modal.inputEl.setSelectionRange(16, 16);

    const [markdownSuggestion] = modal.getSuggestions(modal.inputEl.value);

    expect(markdownSuggestion?.kind).toBe("wikilink");

    modal.selectSuggestion(
      markdownSuggestion!,
      new KeyboardEvent("keydown", { key: "Enter" }),
    );

    expect(modal.inputEl.value).toBe("Review [[Project Alpha]]");
    expect(onChooseSuggestion).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();

    const [confirmSuggestion] = modal.getSuggestions(modal.inputEl.value);

    expect(confirmSuggestion?.kind).toBe("confirm");

    modal.selectSuggestion(
      confirmSuggestion!,
      new KeyboardEvent("keydown", { key: "Enter" }),
    );

    expect(onChooseSuggestion).toHaveBeenCalledWith({
      kind: "confirm",
      text: "Review [[Project Alpha]]",
    });
    expect(close).toHaveBeenCalledOnce();
  });

  test("offers and inserts headings from the linked note", () => {
    const { modal, onChooseSuggestion } = createModal();

    modal.inputEl.value = "Review [[Project Alpha#Over";
    modal.inputEl.setSelectionRange(27, 27);

    const [headingSuggestion] = modal.getSuggestions(modal.inputEl.value);

    expect(headingSuggestion).toEqual(
      expect.objectContaining({
        kind: "heading",
        label: "Overview",
        value: "Project Alpha#Overview",
      }),
    );

    modal.selectSuggestion(
      headingSuggestion!,
      new KeyboardEvent("keydown", { key: "Enter" }),
    );

    expect(modal.inputEl.value).toBe("Review [[Project Alpha#Overview]]");
    expect(onChooseSuggestion).not.toHaveBeenCalled();
  });

  test("uses Tab to select a wikilink and continue inside its brackets", () => {
    const { modal, onChooseSuggestion } = createModal();
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Tab",
    });

    modal.inputEl.value = "Review [[Project";
    modal.inputEl.setSelectionRange(16, 16);
    modal.inputEl.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(modal.inputEl.value).toBe("Review [[Project Alpha]]");
    expect(modal.inputEl.selectionStart).toBe(22);
    expect(modal.inputEl.selectionEnd).toBe(22);
    expect(onChooseSuggestion).not.toHaveBeenCalled();
  });
});
