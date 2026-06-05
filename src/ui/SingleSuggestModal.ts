/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { App, SuggestModal } from "obsidian";

type Suggestion = { text: string };

export class SingleSuggestModal extends SuggestModal<Suggestion> {
  constructor(
    private readonly props: {
      app: App;
      getDescriptionText: (input: string) => string;
      onChooseSuggestion: (suggestion: Suggestion) => void;
      onClose: () => void;
      initialValue?: string;
    },
  ) {
    super(props.app);

    this.setInstructions([
      { command: "esc", purpose: "to dismiss" },
      { command: "↵", purpose: "to confirm" },
    ]);
  }

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
    return [
      {
        text: query,
      },
    ];
  }

  renderSuggestion(item: Suggestion, el: HTMLElement) {
    el.createDiv({ text: this.props.getDescriptionText(item.text) });
  }

  onChooseSuggestion(item: Suggestion, evt: MouseEvent | KeyboardEvent) {
    this.props.onChooseSuggestion(item);
  }

  close() {
    // Note: we need to be able to run onChooseSuggestion before onClose
    window.setTimeout(() => {
      this.props.onClose();
      super.close();
    });
  }
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
