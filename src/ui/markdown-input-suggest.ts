/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { AbstractInputSuggest, type App, getAllTags } from "obsidian";

export type MarkdownSuggestionKind = "tag" | "wikilink";

export interface MarkdownSuggestionContext {
  from: number;
  kind: MarkdownSuggestionKind;
  query: string;
  to: number;
}

interface MarkdownSuggestionCandidate {
  detail?: string;
  kind: MarkdownSuggestionKind;
  value: string;
}

export interface MarkdownInputSuggestion extends MarkdownSuggestionCandidate {
  context: MarkdownSuggestionContext;
  isNew: boolean;
}

export interface MarkdownSuggestionApplication {
  cursor: number;
  value: string;
}

const activeSuggestionInputs = new WeakSet<HTMLInputElement>();

function getWikilinkContext(
  value: string,
  cursor: number,
): MarkdownSuggestionContext | undefined {
  const beforeCursor = value.slice(0, cursor);
  const from = beforeCursor.lastIndexOf("[[");

  if (from < 0 || beforeCursor.lastIndexOf("]]") > from) {
    return undefined;
  }

  const query = beforeCursor.slice(from + 2);

  if (query.includes("\n") || query.includes("\r") || query.includes("|")) {
    return undefined;
  }

  const nextClosingBrackets = value.indexOf("]]", cursor);
  const nextOpeningBrackets = value.indexOf("[[", cursor);
  const to =
    nextClosingBrackets >= 0 &&
    (nextOpeningBrackets < 0 || nextClosingBrackets < nextOpeningBrackets)
      ? nextClosingBrackets + 2
      : cursor;

  return {
    from,
    kind: "wikilink",
    query,
    to,
  };
}

function getTagContext(
  value: string,
  cursor: number,
): MarkdownSuggestionContext | undefined {
  const beforeCursor = value.slice(0, cursor);
  const match = /(?:^|\s)(#[\p{L}\p{N}_/-]*)$/u.exec(beforeCursor);
  const token = match?.[1];

  if (!token) {
    return undefined;
  }

  const from = beforeCursor.length - token.length;
  const suffix = /^[\p{L}\p{N}_/-]*/u.exec(value.slice(cursor))?.[0] ?? "";

  return {
    from,
    kind: "tag",
    query: token.slice(1),
    to: cursor + suffix.length,
  };
}

export function getMarkdownSuggestionContext(
  value: string,
  cursor = value.length,
): MarkdownSuggestionContext | undefined {
  const clampedCursor = Math.max(0, Math.min(cursor, value.length));

  return (
    getWikilinkContext(value, clampedCursor) ??
    getTagContext(value, clampedCursor)
  );
}

function getInsertedText(suggestion: MarkdownInputSuggestion) {
  return suggestion.kind === "wikilink"
    ? `[[${suggestion.value}]]`
    : `#${suggestion.value}`;
}

export function applyMarkdownInputSuggestion(
  value: string,
  suggestion: MarkdownInputSuggestion,
): MarkdownSuggestionApplication {
  const insertedText = getInsertedText(suggestion);

  return {
    cursor: suggestion.context.from + insertedText.length,
    value:
      value.slice(0, suggestion.context.from) +
      insertedText +
      value.slice(suggestion.context.to),
  };
}

function compareCandidates(
  query: string,
  left: MarkdownSuggestionCandidate,
  right: MarkdownSuggestionCandidate,
) {
  const normalizedQuery = query.toLocaleLowerCase();
  const leftValue = left.value.toLocaleLowerCase();
  const rightValue = right.value.toLocaleLowerCase();
  const leftPrefix = leftValue.startsWith(normalizedQuery);
  const rightPrefix = rightValue.startsWith(normalizedQuery);

  if (leftPrefix !== rightPrefix) {
    return leftPrefix ? -1 : 1;
  }

  return left.value.localeCompare(right.value);
}

function getMatchingCandidates(
  candidates: MarkdownSuggestionCandidate[],
  context: MarkdownSuggestionContext,
) {
  const normalizedQuery = context.query.toLocaleLowerCase();

  return candidates
    .filter((candidate) =>
      candidate.value.toLocaleLowerCase().includes(normalizedQuery),
    )
    .sort((left, right) => compareCandidates(context.query, left, right));
}

function deduplicateCandidates(candidates: MarkdownSuggestionCandidate[]) {
  const uniqueCandidates = new Map<string, MarkdownSuggestionCandidate>();

  for (const candidate of candidates) {
    const key = `${candidate.kind}:${candidate.value.toLocaleLowerCase()}`;

    if (!uniqueCandidates.has(key)) {
      uniqueCandidates.set(key, candidate);
    }
  }

  return [...uniqueCandidates.values()];
}

function getFileParentPath(path: string) {
  const lastSeparator = path.lastIndexOf("/");

  return lastSeparator < 0 ? "/" : path.slice(0, lastSeparator + 1);
}

export class MarkdownSuggestionCatalog {
  private readonly candidates: Record<
    MarkdownSuggestionKind,
    MarkdownSuggestionCandidate[]
  >;

  constructor(app: App, sourcePath: string) {
    const files = app.vault.getMarkdownFiles();
    const wikilinks = files.map((file) => ({
      detail: getFileParentPath(file.path),
      kind: "wikilink" as const,
      value: app.metadataCache.fileToLinktext(file, sourcePath, true),
    }));
    const tags = files.flatMap((file) => {
      const cache = app.metadataCache.getFileCache(file);

      return (
        (cache ? getAllTags(cache) : null)?.map((tag) => ({
          kind: "tag" as const,
          value: tag.replace(/^#/, ""),
        })) ?? []
      );
    });

    this.candidates = {
      tag: deduplicateCandidates(tags),
      wikilink: deduplicateCandidates(wikilinks),
    };
  }

  getSuggestions(
    context: MarkdownSuggestionContext,
  ): MarkdownInputSuggestion[] {
    const matchingCandidates = getMatchingCandidates(
      this.candidates[context.kind],
      context,
    );
    const hasExactMatch = matchingCandidates.some(
      (candidate) =>
        candidate.value.toLocaleLowerCase() ===
        context.query.toLocaleLowerCase(),
    );
    const suggestions = matchingCandidates.map((candidate) => ({
      ...candidate,
      context,
      isNew: false,
    }));

    if (context.query.length > 0 && !hasExactMatch) {
      suggestions.push({
        context,
        isNew: true,
        kind: context.kind,
        value: context.query,
      });
    }

    return suggestions;
  }
}

export function renderMarkdownInputSuggestion(
  suggestion: MarkdownInputSuggestion,
  el: HTMLElement,
  inputEl?: HTMLInputElement,
) {
  el.classList.add("mod-complex");

  const contentEl = el.ownerDocument.createElement("div");
  const titleEl = el.ownerDocument.createElement("div");
  const syntax = getInsertedText(suggestion);

  contentEl.className = "suggestion-content";
  titleEl.className = "suggestion-title";
  titleEl.textContent = suggestion.isNew
    ? `Create ${syntax}`
    : suggestion.kind === "wikilink"
      ? suggestion.value
      : syntax;
  contentEl.appendChild(titleEl);

  if (suggestion.detail) {
    const detailEl = el.ownerDocument.createElement("div");

    detailEl.className = "suggestion-note";
    detailEl.textContent = suggestion.detail;
    contentEl.appendChild(detailEl);
  }

  el.appendChild(contentEl);

  if (inputEl) {
    decorateMarkdownInputSuggestionPopover(el, inputEl);
  }
}

function createInstruction(
  containerEl: HTMLElement,
  command: string,
  purpose: string,
) {
  const instructionEl = containerEl.ownerDocument.createElement("span");
  const commandEl = containerEl.ownerDocument.createElement("span");
  const purposeEl = containerEl.ownerDocument.createElement("span");

  instructionEl.className = "prompt-instruction";
  commandEl.className = "prompt-instruction-command";
  commandEl.textContent = command;
  purposeEl.textContent = purpose;
  instructionEl.append(commandEl, purposeEl);

  return instructionEl;
}

function decorateMarkdownInputSuggestionPopover(
  suggestionEl: HTMLElement,
  inputEl: HTMLInputElement,
) {
  const containerEl = suggestionEl.closest<HTMLElement>(
    ".suggestion-container",
  );

  if (!containerEl) {
    return;
  }

  containerEl.classList.add("day-planner-markdown-suggestion");
  containerEl.style.setProperty(
    "--day-planner-markdown-suggestion-width",
    `${inputEl.getBoundingClientRect().width}px`,
  );

  if (
    containerEl.querySelector(".day-planner-markdown-suggestion-instructions")
  ) {
    return;
  }

  const instructionsEl = containerEl.ownerDocument.createElement("div");

  instructionsEl.className =
    "prompt-instructions day-planner-markdown-suggestion-instructions";
  instructionsEl.append(
    createInstruction(containerEl, "↑↓", "to navigate"),
    createInstruction(containerEl, "↵", "to select"),
    createInstruction(containerEl, "esc", "to dismiss"),
  );
  containerEl.appendChild(instructionsEl);
}

export function applyMarkdownInputSuggestionToElement(
  inputEl: HTMLInputElement,
  suggestion: MarkdownInputSuggestion,
) {
  const result = applyMarkdownInputSuggestion(inputEl.value, suggestion);

  inputEl.value = result.value;
  inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  inputEl.setSelectionRange(result.cursor, result.cursor);
  inputEl.focus();
}

class MarkdownInputSuggest extends AbstractInputSuggest<MarkdownInputSuggestion> {
  constructor(
    app: App,
    private readonly inputEl: HTMLInputElement,
    private readonly catalog: MarkdownSuggestionCatalog,
  ) {
    super(app, inputEl);
    this.limit = 50;
  }

  protected getSuggestions(query: string) {
    const context = getMarkdownSuggestionContext(
      query,
      this.inputEl.selectionStart ?? query.length,
    );
    const suggestions = context
      ? this.catalog.getSuggestions(context).slice(0, this.limit)
      : [];

    if (suggestions.length > 0) {
      activeSuggestionInputs.add(this.inputEl);
    } else {
      activeSuggestionInputs.delete(this.inputEl);
    }

    return suggestions;
  }

  renderSuggestion(suggestion: MarkdownInputSuggestion, el: HTMLElement) {
    renderMarkdownInputSuggestion(suggestion, el, this.inputEl);
  }

  selectSuggestion(
    suggestion: MarkdownInputSuggestion,
    event: MouseEvent | KeyboardEvent,
  ) {
    event.preventDefault();
    event.stopPropagation();
    applyMarkdownInputSuggestionToElement(this.inputEl, suggestion);
    this.close();
  }

  close() {
    activeSuggestionInputs.delete(this.inputEl);
    super.close();
  }
}

export type AttachMarkdownInputSuggest = (
  inputEl: HTMLInputElement,
) => (() => void) | undefined;

export function createMarkdownInputSuggest(
  app: App,
  sourcePath: string,
): AttachMarkdownInputSuggest {
  const catalog = new MarkdownSuggestionCatalog(app, sourcePath);

  return (inputEl) => {
    const suggest = new MarkdownInputSuggest(app, inputEl, catalog);

    return () => suggest.close();
  };
}

export function hasActiveMarkdownInputSuggest(inputEl: HTMLInputElement) {
  return activeSuggestionInputs.has(inputEl);
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
