/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { Notice } from "obsidian";

import { undoTimeoutMillis } from "../constants";

export class UndoNotice {
  private current: Notice | undefined;

  constructor(private readonly onUndo: () => void) {}

  show = () => {
    this.current?.hide();
    this.current = new Notice(
      createFragment((fragment) => {
        fragment.appendText("Changes saved. ");
        fragment.append(
          createEl("a", { text: "UNDO" }, (el) => {
            el.addEventListener("pointerup", this.onUndo, {
              once: true,
            });
          }),
          createDiv({ cls: "undo-timeout-bar" }, (el) => {
            el.style.animation = `${undoTimeoutMillis}ms linear forwards shrink`;
          }),
        );
      }),
      undoTimeoutMillis,
    );
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
