/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
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
          createEl("div", { cls: "undo-timeout-bar" }, (el) => {
            el.style.animation = `${undoTimeoutMillis}ms linear forwards shrink`;
          }),
        );
      }),
      undoTimeoutMillis,
    );
  };
}
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
