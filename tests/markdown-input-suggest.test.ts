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
    { basename: "Today", path: "Journal/Today.md" },
  ] as TFile[];
  const tagsByPath = new Map([
    [
      "Projects/Project Alpha.md",
      [{ tag: "#project/alpha" }, { tag: "#work" }],
    ],
    ["Projects/Project Beta.md", [{ tag: "#project/beta" }]],
  ]);
  const headingsByPath = new Map([
    [
      "Projects/Project Alpha.md",
      [
        { heading: "Overview", level: 1 },
        { heading: "Milestones", level: 2 },
      ],
    ],
    [
      "Journal/Today.md",
      [
        { heading: "Daily overview", level: 1 },
        { heading: "Work log", level: 2 },
      ],
    ],
  ]);

  return {
    metadataCache: {
      fileToLinktext: (file: TFile) => file.basename,
      getFirstLinkpathDest: (linkpath: string) =>
        files.find(
          (file) =>
            file.basename === linkpath ||
            file.path.replace(/\.md$/, "") === linkpath,
        ) ?? null,
      getFileCache: (file: TFile) => ({
        headings: headingsByPath.get(file.path) ?? [],
        tags: tagsByPath.get(file.path) ?? [],
      }),
    },
    vault: {
      getFileByPath: (path: string) =>
        files.find((file) => file.path === path) ?? null,
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

  test("finds current-note and linked-note heading queries", () => {
    expect(getMarkdownSuggestionContext("Review [[#Dai")).toEqual({
      from: 7,
      kind: "heading",
      linkpath: "",
      query: "Dai",
      to: 13,
    });
    expect(getMarkdownSuggestionContext("Review [[Project Alpha#Mil")).toEqual({
      from: 7,
      kind: "heading",
      linkpath: "Project Alpha",
      query: "Mil",
      to: 26,
    });
  });

  test("finds an empty heading query inside a complete wikilink", () => {
    expect(getMarkdownSuggestionContext("[[#]]", 3)).toEqual({
      from: 0,
      kind: "heading",
      linkpath: "",
      query: "",
      to: 5,
    });
    expect(getMarkdownSuggestionContext("[[Project Alpha#]]", 16)).toEqual({
      from: 0,
      kind: "heading",
      linkpath: "Project Alpha",
      query: "",
      to: 18,
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

  test("suggests headings from the current note in document order", () => {
    const catalog = new MarkdownSuggestionCatalog(
      createApp(),
      "Journal/Today.md",
    );
    const context = getMarkdownSuggestionContext("Review [[#");

    expect(context).toBeDefined();
    expect(
      catalog
        .getSuggestions(context!)
        .map(({ detail, isNew, label, value }) => ({
          detail,
          isNew,
          label,
          value,
        })),
    ).toEqual([
      {
        detail: "Journal/Today.md",
        isNew: false,
        label: "Daily overview",
        value: "#Daily overview",
      },
      {
        detail: "Journal/Today.md",
        isNew: false,
        label: "Work log",
        value: "#Work log",
      },
    ]);
  });

  test("resolves a linked note and matches its headings", () => {
    const catalog = new MarkdownSuggestionCatalog(
      createApp(),
      "Journal/Today.md",
    );
    const context = getMarkdownSuggestionContext("Review [[Project Alpha#mile");

    expect(context).toBeDefined();
    expect(
      catalog
        .getSuggestions(context!)
        .map(({ isNew, label, value }) => ({ isNew, label, value })),
    ).toEqual([
      {
        isNew: false,
        label: "Milestones",
        value: "Project Alpha#Milestones",
      },
    ]);
  });

  test("does not invent heading suggestions for an unresolved note", () => {
    const catalog = new MarkdownSuggestionCatalog(
      createApp(),
      "Journal/Today.md",
    );
    const context = getMarkdownSuggestionContext("Review [[Missing#");

    expect(context).toBeDefined();
    expect(catalog.getSuggestions(context!)).toEqual([]);
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
    ).toBe("↑↓to navigate↵to selecttabto select and continueescto dismiss");
  });

  test("renders a heading label and its source note", () => {
    const itemEl = document.createElement("div");
    const context = getMarkdownSuggestionContext("[[Project Alpha#Over");

    expect(context).toBeDefined();

    renderMarkdownInputSuggestion(
      suggestion({
        context: context!,
        detail: "Projects/Project Alpha.md",
        kind: "heading",
        label: "Overview",
        value: "Project Alpha#Overview",
      }),
      itemEl,
    );

    expect(itemEl.querySelector(".suggestion-title")?.textContent).toBe(
      "Overview",
    );
    expect(itemEl.querySelector(".suggestion-note")?.textContent).toBe(
      "Projects/Project Alpha.md",
    );
  });

  test("renders a new tag as freely insertable syntax", () => {
    const itemEl = document.createElement("div");
    const context = getMarkdownSuggestionContext("#new-tag");

    expect(context).toBeDefined();

    renderMarkdownInputSuggestion(
      suggestion({
        context: context!,
        isNew: true,
        kind: "tag",
        value: "new-tag",
      }),
      itemEl,
    );

    expect(
      itemEl.querySelector(".day-planner-markdown-suggestion-label")
        ?.textContent,
    ).toBe("#new-tag");
    expect(
      itemEl.querySelector(".day-planner-markdown-suggestion-status"),
    ).toBeNull();
    expect(itemEl.textContent).not.toContain("Create");
  });

  test("marks a new wikilink as unresolved without implying file creation", () => {
    const itemEl = document.createElement("div");
    const context = getMarkdownSuggestionContext("[[Missing note");

    expect(context).toBeDefined();

    renderMarkdownInputSuggestion(
      suggestion({
        context: context!,
        isNew: true,
        kind: "wikilink",
        value: "Missing note",
      }),
      itemEl,
    );

    expect(
      itemEl.querySelector(".day-planner-markdown-suggestion-label")
        ?.textContent,
    ).toBe("[[Missing note]]");
    expect(
      itemEl.querySelector(".day-planner-markdown-suggestion-status")
        ?.textContent,
    ).toBe("Unresolved");
    expect(itemEl.textContent).not.toContain("Create");
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

  test("keeps the cursor inside a wikilink when continuing with Tab", () => {
    const context = getMarkdownSuggestionContext("Review [[Project");

    expect(context).toBeDefined();
    expect(
      applyMarkdownInputSuggestion(
        "Review [[Project",
        suggestion({
          context: context!,
          kind: "wikilink",
          value: "Project Alpha",
        }),
        { keepCursorInsideWikilink: true },
      ),
    ).toEqual({
      cursor: 22,
      value: "Review [[Project Alpha]]",
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

  test("completes a current-note heading link", () => {
    const context = getMarkdownSuggestionContext("Review [[#Dai");

    expect(context).toBeDefined();
    expect(
      applyMarkdownInputSuggestion(
        "Review [[#Dai",
        suggestion({
          context: context!,
          kind: "heading",
          label: "Daily overview",
          value: "#Daily overview",
        }),
      ),
    ).toEqual({
      cursor: 26,
      value: "Review [[#Daily overview]]",
    });
  });

  test("replaces a complete linked-note heading and preserves following text", () => {
    const context = getMarkdownSuggestionContext(
      "Review [[Project Alpha#Old]] later",
      26,
    );

    expect(context).toBeDefined();
    expect(
      applyMarkdownInputSuggestion(
        "Review [[Project Alpha#Old]] later",
        suggestion({
          context: context!,
          kind: "heading",
          label: "Milestones",
          value: "Project Alpha#Milestones",
        }),
      ),
    ).toEqual({
      cursor: 35,
      value: "Review [[Project Alpha#Milestones]] later",
    });
  });
});
