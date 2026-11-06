import { Menu, Notice } from "obsidian";

import type { ObsidianContext } from "../types";
import type { RecurringPreview } from "../util/recurring-preview";

type PreviewActions = Pick<
  ObsidianContext,
  "workspaceFacade" | "confirmAction" | "createRecurringOccurrence"
>;

export function createRecurringPreviewMenu(
  event: MouseEvent,
  preview: RecurringPreview,
  actions: PreviewActions,
) {
  event.preventDefault();
  event.stopPropagation();
  const menu = new Menu();
  const reportError = (error: unknown) => new Notice(String(error));
  menu.addItem((item) =>
    item
      .setTitle("Open original task")
      .setIcon("file-input")
      .onClick(() => {
        void actions.workspaceFacade
          .revealLocation(preview.source)
          .catch(reportError);
      }),
  );
  menu.addItem((item) =>
    item
      .setTitle("Create task early…")
      .setIcon("calendar-plus")
      .onClick(async () => {
        try {
          const confirmed = await actions.confirmAction({
            title: "Create task early?",
            text: `Add “${preview.title}” for ${preview.occurrenceDay} to the original note? Completing an earlier task in Tasks may create a duplicate.`,
            cta: "Create early",
            variant: "warning",
          });
          if (!confirmed) return;
          await actions.createRecurringOccurrence(preview);
          new Notice("Task created");
        } catch (error) {
          reportError(error);
        }
      }),
  );
  menu.showAtMouseEvent(event);
}
