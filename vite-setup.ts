import moment, { type Moment } from "moment";
import { vi, expect } from "vitest";
import path from "path";
import yaml from "js-yaml";

window.moment = moment;

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

Object.defineProperty(HTMLElement.prototype, "empty", {
  configurable: true,
  value(this: HTMLElement) {
    this.replaceChildren();
  },
});

vi.mock("obsidian", () => ({
  moment,
  TFile: vi.fn(),
  normalizePath: (p: string) => path.normalize(p),
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
  SuggestModal: class SuggestModal {
    constructor() {
      throw new Error("SuggestModal is not implemented in tests");
    }
  },
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
