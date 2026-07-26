import type { App, TFile } from "obsidian";
import { describe, expect, test, vi } from "vitest";

import {
  applyMarkdownInputSuggestion,
  getMarkdownSuggestionContext,
  type MarkdownInputSuggestion,
  MarkdownSuggestionCatalog,
  renderMarkdownInputSuggestion,
} from "../src/ui/markdown-input-suggest";

function createApp() {
  const files = [
    { basename: "Project Alpha", path: "Projects/Project Alpha.md" },
    { basename: "Project Beta", path: "Projects/Project Beta.md" },
  ] as TFile[];
  const tagsByPath = new Map([
    [
      "Projects/Project Alpha.md",
      [{ tag: "#project/alpha" }, { tag: "#work" }],
    ],
    ["Projects/Project Beta.md", [{ tag: "#project/beta" }]],
  ]);

  return {
    metadataCache: {
      fileToLinktext: (file: TFile) => file.basename,
      getFileCache: (file: TFile) => ({
        tags: tagsByPath.get(file.path) ?? [],
      }),
    },
    vault: {
      getMarkdownFiles: () => files,
    },
  } as unknown as App;
}

function suggestion(
  input: Partial<MarkdownInputSuggestion> &
    Pick<MarkdownInputSuggestion, "context" | "kind" | "value">,
): MarkdownInputSuggestion {
  return {
    isNew: false,
    ...input,
  };
}

describe("markdown input suggestion context", () => {
  test("finds an unfinished wikilink at the cursor", () => {
    expect(getMarkdownSuggestionContext("Review [[Project Al")).toEqual({
      from: 7,
      kind: "wikilink",
      query: "Project Al",
      to: 19,
    });
  });

  test("replaces the complete wikilink when editing inside it", () => {
    expect(
      getMarkdownSuggestionContext("Review [[Old note]] later", 12),
    ).toEqual({
      from: 7,
      kind: "wikilink",
      query: "Old",
      to: 19,
    });
  });

  test("finds a nested tag token and ignores completed tokens", () => {
    expect(getMarkdownSuggestionContext("Review #project/al")).toEqual({
      from: 7,
      kind: "tag",
      query: "project/al",
      to: 18,
    });
    expect(getMarkdownSuggestionContext("Review #project/alpha next")).toBe(
      undefined,
    );
  });
});

describe("MarkdownSuggestionCatalog", () => {
  test("suggests existing notes and an unresolved link candidate", () => {
    const catalog = new MarkdownSuggestionCatalog(
      createApp(),
      "Journal/Today.md",
    );
    const context = getMarkdownSuggestionContext("Review [[Project");

    expect(context).toBeDefined();

    const matches = catalog.getSuggestions(context!);

    expect(matches.map(({ value, isNew }) => ({ value, isNew }))).toEqual([
      { value: "Project Alpha", isNew: false },
      { value: "Project Beta", isNew: false },
      { value: "Project", isNew: true },
    ]);
    expect(matches[0]?.detail).toBe("Projects/");
  });

  test("suggests existing nested tags without duplicates", () => {
    const catalog = new MarkdownSuggestionCatalog(
      createApp(),
      "Journal/Today.md",
    );
    const context = getMarkdownSuggestionContext("Review #project/");

    expect(context).toBeDefined();
    expect(catalog.getSuggestions(context!).map(({ value }) => value)).toEqual([
      "project/alpha",
      "project/beta",
      "project/",
    ]);
  });
});

describe("renderMarkdownInputSuggestion", () => {
  test("uses Obsidian's complex suggestion structure and decorates the input popover", () => {
    const inputEl = document.createElement("input");
    const containerEl = document.createElement("div");
    const listEl = document.createElement("div");
    const itemEl = document.createElement("div");
    const context = getMarkdownSuggestionContext("[[Project");

    expect(context).toBeDefined();

    containerEl.className = "suggestion-container";
    listEl.className = "suggestion";
    containerEl.appendChild(listEl);
    listEl.appendChild(itemEl);
    vi.spyOn(inputEl, "getBoundingClientRect").mockReturnValue({
      bottom: 0,
      height: 32,
      left: 0,
      right: 640,
      toJSON: () => ({}),
      top: 0,
      width: 640,
      x: 0,
      y: 0,
    });

    renderMarkdownInputSuggestion(
      suggestion({
        context: context!,
        detail: "Projects/",
        kind: "wikilink",
        value: "Project Alpha",
      }),
      itemEl,
      inputEl,
    );

    expect(itemEl.classList.contains("mod-complex")).toBe(true);
    expect(itemEl.querySelector(".suggestion-title")?.textContent).toBe(
      "Project Alpha",
    );
    expect(itemEl.querySelector(".suggestion-note")?.textContent).toBe(
      "Projects/",
    );
    expect(
      containerEl.style.getPropertyValue(
        "--day-planner-markdown-suggestion-width",
      ),
    ).toBe("640px");
    expect(
      containerEl.querySelector(".day-planner-markdown-suggestion-instructions")
        ?.textContent,
    ).toBe("↑↓to navigate↵to selectescto dismiss");
  });
});

describe("applyMarkdownInputSuggestion", () => {
  test("completes a wikilink and preserves following text", () => {
    const context = getMarkdownSuggestionContext(
      "Review [[Old note]] later",
      12,
    );

    expect(context).toBeDefined();
    expect(
      applyMarkdownInputSuggestion(
        "Review [[Old note]] later",
        suggestion({
          context: context!,
          kind: "wikilink",
          value: "Project Alpha",
        }),
      ),
    ).toEqual({
      cursor: 24,
      value: "Review [[Project Alpha]] later",
    });
  });

  test("completes a tag and preserves following text", () => {
    const context = getMarkdownSuggestionContext("Review #proj later", 12);

    expect(context).toBeDefined();
    expect(
      applyMarkdownInputSuggestion(
        "Review #proj later",
        suggestion({
          context: context!,
          kind: "tag",
          value: "project/alpha",
        }),
      ),
    ).toEqual({
      cursor: 21,
      value: "Review #project/alpha later",
    });
  });
});
