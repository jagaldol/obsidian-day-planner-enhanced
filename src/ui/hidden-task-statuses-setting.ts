import type { Setting } from "obsidian";

import { parseHiddenTaskStatuses } from "../util/task-status";

const description =
  "Hide these checkbox statuses from the planner. Example: [-], [?], [ ]. Leave empty to hide none.";
const invalidInputMessage =
  "Use one character inside each pair of brackets, e.g. [-], [?], [ ]. The last valid setting is still active.";

export function addHiddenTaskStatusesSetting(
  setting: Setting,
  statuses: readonly string[],
  onChange: (statuses: string[]) => void,
) {
  setting
    .setName("Hidden task statuses")
    .setDesc(description)
    .addText((text) => {
      text
        .setPlaceholder("[-], [?]")
        .setValue(statuses.map((status) => `[${status}]`).join(", "))
        .onChange((value) => {
          const parsed = parseHiddenTaskStatuses(value);
          const invalid = parsed === undefined;

          text.inputEl.setAttribute("aria-invalid", String(invalid));
          text.inputEl.setCustomValidity(invalid ? invalidInputMessage : "");
          setting.setDesc(invalid ? invalidInputMessage : description);

          if (parsed !== undefined) {
            onChange(parsed);
          }
        });
      text.inputEl.setAttribute("aria-label", "Hidden task statuses");
    });
}
