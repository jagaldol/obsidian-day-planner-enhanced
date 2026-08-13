/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { type App, Notice, type TFile } from "obsidian";

import {
  createAttachmentFileName,
  getFileExtension,
  isEmbeddableExtension,
  sanitizeAttachmentFileName,
  toAttachmentMarkdown,
} from "./clipboard-attachment";

function getAttachmentSaver(app: App): unknown {
  return "saveAttachment" in app ? app.saveAttachment : undefined;
}

function isAttachmentFile(value: unknown): value is TFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    typeof value.path === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "extension" in value &&
    typeof value.extension === "string"
  );
}

function splitAttachmentFileName(fileName: string) {
  const extension = getFileExtension(fileName);

  return {
    baseName:
      extension.length > 0
        ? fileName.slice(0, -(extension.length + 1))
        : fileName,
    extension,
  };
}

async function saveForSourcePath(
  app: App,
  fileName: string,
  sourcePath: string,
  data: ArrayBuffer,
) {
  const safeFileName = sanitizeAttachmentFileName(fileName);
  const attachmentPath = await app.fileManager.getAvailablePathForAttachment(
    safeFileName,
    sourcePath,
  );

  return app.vault.createBinary(attachmentPath, data);
}

async function saveThroughObsidian(
  app: App,
  fileName: string,
  sourcePath: string,
  data: ArrayBuffer,
) {
  const activeFile = app.workspace.getActiveFile();
  const attachmentSaver = getAttachmentSaver(app);

  // Obsidian's editor paste path is app.saveAttachment. Using that native
  // pipeline preserves Obsidian's attachment behavior without depending on a
  // particular extension or its settings. The API uses the active file as its
  // note context, so only use it when that context is the note being edited.
  // Otherwise retain the explicit source path so a timeline task from another
  // note cannot save into the wrong relative folder.
  if (
    activeFile?.path === sourcePath &&
    typeof attachmentSaver === "function"
  ) {
    const { baseName, extension } = splitAttachmentFileName(fileName);
    const attachment: unknown = await attachmentSaver.call(
      app,
      baseName,
      extension,
      data,
    );

    if (!isAttachmentFile(attachment)) {
      throw new TypeError("Obsidian did not return a saved attachment file");
    }

    return attachment;
  }

  return saveForSourcePath(app, fileName, sourcePath, data);
}

function generateAttachmentLink(
  app: App,
  attachment: TFile,
  sourcePath: string,
) {
  const link = app.fileManager.generateMarkdownLink(attachment, sourcePath);

  // In Markdown-link mode Obsidian can return an empty label (`[](path)`).
  // That is invisible when the attachment is intentionally a plain link, so
  // fill only the empty label while preserving the exact target Obsidian
  // generated. Regenerating with an alias can change relative-path handling.
  // Wikilinks and embeds retain the exact native result.
  if (!isEmbeddableExtension(attachment.extension) && link.startsWith("[](")) {
    const label = attachment.name
      .replaceAll("\\", "\\\\")
      .replaceAll("]", "\\]");

    return `[${label}]${link.slice(2)}`;
  }

  return link;
}

/**
 * Saves a clipboard file into the vault's attachment folder and returns the
 * markdown that links to it, mirroring what pasting into the Obsidian editor
 * produces. Returns `undefined` when the attachment could not be written.
 */
export const createSaveClipboardAttachment =
  (app: App, sourcePath: string) =>
  async (file: File): Promise<string | undefined> => {
    try {
      const data = await file.arrayBuffer();
      const fileName = createAttachmentFileName(file, new Date());
      const attachment = await saveThroughObsidian(
        app,
        fileName,
        sourcePath,
        data,
      );
      const link = generateAttachmentLink(app, attachment, sourcePath);

      return toAttachmentMarkdown(link, attachment.extension);
    } catch (error) {
      new Notice(`Failed to save pasted attachment: ${String(error)}`);
      console.error(error);

      return undefined;
    }
  };
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
