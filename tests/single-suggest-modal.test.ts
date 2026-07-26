import type { App, TFile } from "obsidian";
import { describe, expect, test, vi } from "vitest";

import { SingleSuggestModal } from "../src/ui/SingleSuggestModal";

function createApp() {
  const files = [
    { basename: "Project Alpha", path: "Projects/Project Alpha.md" },
  ] as TFile[];

  return {
    metadataCache: {
      fileToLinktext: (file: TFile) => file.basename,
      getFileCache: () => ({ tags: [{ tag: "#project/alpha" }] }),
    },
    vault: {
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
    sourcePath: "Journal/Today.md",
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
});
