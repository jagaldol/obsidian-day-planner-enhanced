/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { App, Notice } from "obsidian";

import {
  createAttachmentFileName,
  toAttachmentMarkdown,
} from "./clipboard-attachment";

/**
 * Saves a clipboard file into the vault's attachment folder and returns the
 * markdown that links to it, mirroring what pasting into the Obsidian editor
 * produces. Returns `undefined` when the attachment could not be written.
 */
export const createSaveClipboardAttachment =
  (app: App, sourcePath: string) =>
  async (file: File): Promise<string | undefined> => {
    try {
      const fileName = createAttachmentFileName(file, new Date());
      const attachmentPath =
        await app.fileManager.getAvailablePathForAttachment(
          fileName,
          sourcePath,
        );
      const attachment = await app.vault.createBinary(
        attachmentPath,
        await file.arrayBuffer(),
      );
      const link = app.fileManager.generateMarkdownLink(attachment, sourcePath);

      return toAttachmentMarkdown(link, attachment.extension);
    } catch (error) {
      new Notice(`Failed to save pasted attachment: ${String(error)}`);
      console.error(error);

      return undefined;
    }
  };
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
