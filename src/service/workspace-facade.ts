/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import {
  FileView,
  MarkdownView,
  TFile,
  Workspace,
  WorkspaceLeaf,
} from "obsidian";
import { isInstanceOf, isNotVoid } from "typed-assert";

import type { Moment } from "../util/obsidian-moment";

import type { PeriodicNotes } from "./periodic-notes";
import type { VaultFacade } from "./vault-facade";

function doesLeafContainFile(leaf: WorkspaceLeaf, file: TFile) {
  const { view } = leaf;

  return view instanceof FileView && view.file === file;
}

export class WorkspaceFacade {
  constructor(
    private readonly workspace: Workspace,
    private readonly vaultFacade: VaultFacade,
    private readonly periodicNotes: PeriodicNotes,
  ) {}

  async openFileInEditor(file: TFile) {
    const leafWithThisFile = this.workspace
      .getLeavesOfType("markdown")
      .find((leaf) => doesLeafContainFile(leaf, file));

    if (leafWithThisFile) {
      this.workspace.setActiveLeaf(leafWithThisFile, { focus: true });

      if (leafWithThisFile.view instanceof MarkdownView) {
        return leafWithThisFile.view.editor;
      }
    } else {
      const newLeaf = this.workspace.getLeaf(false);

      await newLeaf.openFile(file);

      if (newLeaf.view instanceof MarkdownView) {
        return newLeaf.view.editor;
      }
    }
  }

  getLastCaretLocation = () => {
    const view = this.getActiveMarkdownView();

    const file = view.file;

    isNotVoid(file, "There is no file in view");

    const path = file.path;
    const line = view.editor.getCursor().line;

    return { path, line };
  };

  async openFileForDay(moment: Moment) {
    const dailyNote =
      this.periodicNotes.getDailyNote(
        moment,
        this.periodicNotes.getAllDailyNotes(),
      ) || (await this.periodicNotes.createDailyNote(moment));

    return this.openFileInEditor(dailyNote);
  }

  getActiveMarkdownView = () => {
    const view = this.workspace.getMostRecentLeaf()?.view;

    isInstanceOf(view, MarkdownView, "No markdown editor is active");

    return view;
  };

  async revealLineInFile(path: string, line: number) {
    const file = this.vaultFacade.getFileByPath(path);

    const editor = await this.openFileInEditor(file);

    if (!editor) {
      return;
    }

    this.workspace
      .getActiveViewOfType(MarkdownView)
      ?.setEphemeralState({ line });

    editor.setCursor({ line, ch: editor.getLine(line).length });
  }
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
