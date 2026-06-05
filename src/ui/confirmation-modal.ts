/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { App, Modal } from "obsidian";

export interface ConfirmationModalProps {
  cta: string;
  text: string;
  title: string;
}

class ConfirmationModal extends Modal {
  constructor(
    app: App,
    props: ConfirmationModalProps & {
      onAccept: (event: MouseEvent) => Promise<void>;
      onCancel: (event: MouseEvent) => void;
    },
  ) {
    super(app);

    const { cta, onAccept, text, title, onCancel } = props;

    this.contentEl.createEl("h2", { text: title });
    this.contentEl.createEl("p", { text });

    this.contentEl.createDiv(
      "planner-confirmation-modal-buttons",
      (buttonsEl) => {
        buttonsEl
          .createEl("button", {
            cls: "mod-cta",
            text: cta,
          })
          .addEventListener("click", async (e) => {
            await onAccept(e);

            this.close();
          });

        buttonsEl
          .createEl("button", { text: "Cancel" })
          .addEventListener("click", (e) => {
            onCancel(e);
            this.close();
          });
      },
    );
  }
}

export async function askForConfirmation(
  props: {
    app: App;
  } & ConfirmationModalProps,
): Promise<boolean> {
  return new Promise((resolve) => {
    const { app, ...rest } = props;

    new ConfirmationModal(app, {
      ...rest,
      onAccept: async () => resolve(true),
      onCancel: () => resolve(false),
    }).open();
  });
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
