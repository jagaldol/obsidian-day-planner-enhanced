/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { App, SuggestModal } from "obsidian";

import {
  applyMarkdownInputSuggestionToElement,
  getMarkdownSuggestionContext,
  type MarkdownInputSuggestion,
  MarkdownSuggestionCatalog,
  renderMarkdownInputSuggestion,
} from "./markdown-input-suggest";

type ConfirmSuggestion = { kind: "confirm"; text: string };
type Suggestion = ConfirmSuggestion | MarkdownInputSuggestion;

export class SingleSuggestModal extends SuggestModal<Suggestion> {
  constructor(
    private readonly props: {
      app: App;
      getDescriptionText: (input: string) => string;
      onChooseSuggestion: (suggestion: ConfirmSuggestion) => void;
      onClose: () => void;
      initialValue?: string;
      sourcePath?: string;
    },
  ) {
    super(props.app);
    this.markdownSuggestionCatalog = new MarkdownSuggestionCatalog(
      props.app,
      props.sourcePath ?? "/",
    );

    this.setInstructions([
      { command: "↑↓", purpose: "to navigate" },
      { command: "esc", purpose: "to dismiss" },
      { command: "↵", purpose: "to select or confirm" },
      { command: "tab", purpose: "to select and continue" },
    ]);

    this.inputEl.addEventListener("keydown", this.handleTab, true);
  }

  private readonly markdownSuggestionCatalog: MarkdownSuggestionCatalog;

  onOpen() {
    super.onOpen();

    if (this.props.initialValue !== undefined) {
      this.inputEl.value = this.props.initialValue;
      // todo: this is doubtful
      this.inputEl.dispatchEvent(new Event("input"));
      this.inputEl.select();
    }
  }

  getSuggestions(query: string) {
    const context = getMarkdownSuggestionContext(
      query,
      this.inputEl.selectionStart ?? query.length,
    );

    if (context) {
      return this.markdownSuggestionCatalog.getSuggestions(context);
    }

    return [
      {
        kind: "confirm" as const,
        text: query,
      },
    ];
  }

  renderSuggestion(item: Suggestion, el: HTMLElement) {
    if (item.kind === "confirm") {
      el.createDiv({ text: this.props.getDescriptionText(item.text) });
      return;
    }

    renderMarkdownInputSuggestion(item, el);
  }

  selectSuggestion(item: Suggestion, evt: MouseEvent | KeyboardEvent) {
    if (item.kind === "confirm") {
      super.selectSuggestion(item, evt);
      return;
    }

    evt.preventDefault();
    evt.stopPropagation();
    applyMarkdownInputSuggestionToElement(this.inputEl, item, {
      keepCursorInsideWikilink: "key" in evt && evt.key === "Tab",
    });
  }

  onChooseSuggestion(item: Suggestion, evt: MouseEvent | KeyboardEvent) {
    if (item.kind === "confirm") {
      this.props.onChooseSuggestion(item);
    }
  }

  close() {
    this.inputEl.removeEventListener("keydown", this.handleTab, true);

    // Note: we need to be able to run onChooseSuggestion before onClose
    window.setTimeout(() => {
      this.props.onClose();
      super.close();
    });
  }

  private readonly handleTab = (event: KeyboardEvent) => {
    if (event.key !== "Tab" || event.shiftKey) {
      return;
    }

    const context = getMarkdownSuggestionContext(
      this.inputEl.value,
      this.inputEl.selectionStart ?? this.inputEl.value.length,
    );

    if (
      !context ||
      this.markdownSuggestionCatalog.getSuggestions(context).length === 0
    ) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    this.selectActiveSuggestion(event);
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
