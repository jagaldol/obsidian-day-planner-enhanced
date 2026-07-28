import moment, { type Moment } from "moment";
import { vi, expect } from "vitest";
import path from "path";
import yaml from "js-yaml";

window.moment = moment;
window.requestIdleCallback = (callback) =>
  window.setTimeout(
    () =>
      callback({
        didTimeout: false,
        timeRemaining: () => 50,
      }),
    0,
  );
window.cancelIdleCallback = (handle) => window.clearTimeout(handle);

class MockValueControl {
  addOptions(_options: Record<string, string>) {
    return this;
  }

  setValue(_value: string | boolean) {
    return this;
  }

  onChange(_callback: (value: never) => unknown) {
    return this;
  }
}

class MockSetting {
  setName(_name: string) {
    return this;
  }

  setDesc(_description: string) {
    return this;
  }

  addDropdown(callback: (control: MockValueControl) => unknown) {
    callback(new MockValueControl());

    return this;
  }

  addToggle(callback: (control: MockValueControl) => unknown) {
    callback(new MockValueControl());

    return this;
  }
}

class MockSettingGroup {
  constructor(_containerEl: HTMLElement) {}

  setHeading(_heading: string) {
    return this;
  }

  addSetting(callback: (setting: MockSetting) => unknown) {
    callback(new MockSetting());

    return this;
  }
}

class MockMenuItem {
  setTitle(_title: string) {
    return this;
  }

  setIcon(_icon: string) {
    return this;
  }

  onClick(_callback: () => unknown) {
    return this;
  }
}

class MockMenu {
  addItem(callback: (item: MockMenuItem) => unknown) {
    callback(new MockMenuItem());

    return this;
  }

  showAtMouseEvent(_event: MouseEvent) {}
}

class MockAbstractInputSuggest {
  limit = 100;

  constructor(_app: unknown, _textInputEl: HTMLInputElement | HTMLDivElement) {}

  close() {}
}

class MockSuggestModal {
  inputEl = document.createElement("input");
  resultContainerEl = document.createElement("div");

  constructor(_app: unknown) {}

  setInstructions(_instructions: unknown[]) {}

  onOpen() {}

  selectSuggestion(item: unknown, event: MouseEvent | KeyboardEvent) {
    (
      this as unknown as {
        onChooseSuggestion: (
          value: unknown,
          selectionEvent: MouseEvent | KeyboardEvent,
        ) => void;
      }
    ).onChooseSuggestion(item, event);
    this.close();
  }

  selectActiveSuggestion(event: MouseEvent | KeyboardEvent) {
    const suggestions = (
      this as unknown as {
        getSuggestions: (query: string) => unknown[];
      }
    ).getSuggestions(this.inputEl.value);
    const suggestion = suggestions[0];

    if (suggestion) {
      this.selectSuggestion(suggestion, event);
    }
  }

  close() {}
}

Object.defineProperty(HTMLElement.prototype, "empty", {
  configurable: true,
  value(this: HTMLElement) {
    this.replaceChildren();
  },
});

function appendTestElement<K extends keyof HTMLElementTagNameMap>(
  parent: Node,
  tag: K,
): HTMLElementTagNameMap[K] {
  const el = (parent.ownerDocument ?? document).createElement(tag);

  parent.appendChild(el);

  return el;
}

Object.defineProperty(Node.prototype, "createDiv", {
  configurable: true,
  value(this: Node): HTMLDivElement {
    return appendTestElement(this, "div");
  },
});

Object.defineProperty(Node.prototype, "createSpan", {
  configurable: true,
  value(this: Node): HTMLSpanElement {
    return appendTestElement(this, "span");
  },
});

vi.mock("obsidian", () => ({
  AbstractInputSuggest: MockAbstractInputSuggest,
  getAllTags: (cache: { tags?: Array<{ tag: string }> }) =>
    cache.tags?.map(({ tag }) => tag) ?? null,
  moment,
  TFile: vi.fn(),
  normalizePath: (p: string) => path.normalize(p),
  stripHeadingForLink: (heading: string) => heading,
  parseYaml: (source: string) => {
    return yaml.load(source);
  },
  stringifyYaml: (source: unknown) => {
    return yaml.dump(source, { forceQuotes: false });
  },
  Modal: class Modal {
    constructor() {
      throw new Error("Modal is not implemented in tests");
    }
  },
  SuggestModal: MockSuggestModal,
  Menu: MockMenu,
  SettingGroup: MockSettingGroup,
  Notice: vi.fn(),
}));

function areMomentsEqual(a: Moment, b: Moment) {
  const isAMomment = moment.isMoment(a);
  const isBMomment = moment.isMoment(b);

  if (isAMomment && isBMomment) {
    return a.isSame(b);
  } else if (!isAMomment && !isBMomment) {
    return undefined;
  }

  return false;
}

expect.addEqualityTesters([areMomentsEqual]);
