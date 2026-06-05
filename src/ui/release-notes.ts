/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { ItemView, MarkdownPreviewView } from "obsidian";

import { viewTypeReleaseNotes } from "../constants";

export class DayPlannerReleaseNotesView extends ItemView {
  getViewType() {
    return viewTypeReleaseNotes;
  }

  getDisplayText() {
    return `Day Planner Enhanced Release ${currentPluginVersion}`;
  }

  async onOpen() {
    this.contentEl.addClass("release-notes-view");

    // This is copied from Obsidian, to preserve similarity with Obsidian's release notes
    const container = this.contentEl
      .createDiv({ cls: "cm-scroller is-readable-line-width" })
      .createDiv({ cls: "markdown-preview-view markdown-rendered" });

    await MarkdownPreviewView.render(
      this.app,
      changelogMd,
      container,
      "/",
      this,
    );
  }
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
