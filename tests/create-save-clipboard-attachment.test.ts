import type { App, TFile } from "obsidian";
import { describe, expect, test, vi } from "vitest";

import { createSaveClipboardAttachment } from "../src/util/create-save-clipboard-attachment";

function createClipboardFile(name: string, type: string) {
  const data = new Uint8Array([1, 2, 3]).buffer;
  const file = new File(["content"], name, { type });

  Object.defineProperty(file, "arrayBuffer", {
    value: vi.fn(async () => data),
  });

  return { data, file };
}

function createApp({
  activePath,
  markdownLinks = false,
  savedAttachment,
}: {
  activePath: string | null;
  markdownLinks?: boolean;
  savedAttachment: Pick<TFile, "extension" | "name" | "path">;
}) {
  const saveAttachment = vi.fn(async () => savedAttachment as TFile);
  const getAvailablePathForAttachment = vi.fn(
    async (fileName: string) => `_attachments/${fileName}`,
  );
  const createBinary = vi.fn(async () => savedAttachment as TFile);
  const generateMarkdownLink = vi.fn(
    (
      attachment: Pick<TFile, "path">,
      _sourcePath: string,
      _subpath?: string,
      alias?: string,
    ) =>
      markdownLinks
        ? `[${alias ?? ""}](${attachment.path})`
        : `[[${attachment.path}]]`,
  );
  const app = {
    fileManager: {
      generateMarkdownLink,
      getAvailablePathForAttachment,
    },
    saveAttachment,
    vault: { createBinary },
    workspace: {
      getActiveFile: () =>
        activePath === null ? null : ({ path: activePath } as TFile),
    },
  } as unknown as App;

  return {
    app,
    createBinary,
    generateMarkdownLink,
    getAvailablePathForAttachment,
    saveAttachment,
  };
}

describe("createSaveClipboardAttachment", () => {
  test("uses Obsidian's attachment pipeline for the active source note", async () => {
    const savedAttachment = {
      extension: "jpg",
      name: "renamed.jpg",
      path: "Attachments/renamed.jpg",
    };
    const { app, createBinary, getAvailablePathForAttachment, saveAttachment } =
      createApp({ activePath: "Daily.md", savedAttachment });
    const { data, file } = createClipboardFile("Photo.PNG", "image/png");

    const markdown = await createSaveClipboardAttachment(app, "Daily.md")(file);

    expect(saveAttachment).toHaveBeenCalledWith("Photo", "png", data);
    expect(getAvailablePathForAttachment).not.toHaveBeenCalled();
    expect(createBinary).not.toHaveBeenCalled();
    expect(markdown).toBe("![[Attachments/renamed.jpg]]");
    const [arrayBufferCall] = vi.mocked(file.arrayBuffer).mock
      .invocationCallOrder;
    const [saveAttachmentCall] = saveAttachment.mock.invocationCallOrder;

    expect(arrayBufferCall).toBeDefined();
    expect(saveAttachmentCall).toBeDefined();
    expect(arrayBufferCall as number).toBeLessThan(
      saveAttachmentCall as number,
    );
  });

  test("keeps the explicit source path when another note is active", async () => {
    const savedAttachment = {
      extension: "pdf",
      name: "Quarterly brief.pdf",
      path: "_attachments/Quarterly brief.pdf",
    };
    const { app, createBinary, getAvailablePathForAttachment, saveAttachment } =
      createApp({ activePath: "Other.md", savedAttachment });
    const { data, file } = createClipboardFile(
      "Quarterly brief.pdf",
      "application/pdf",
    );

    const markdown = await createSaveClipboardAttachment(app, "Daily.md")(file);

    expect(saveAttachment).not.toHaveBeenCalled();
    expect(getAvailablePathForAttachment).toHaveBeenCalledWith(
      "Quarterly brief.pdf",
      "Daily.md",
    );
    expect(createBinary).toHaveBeenCalledWith(
      "_attachments/Quarterly brief.pdf",
      data,
    );
    expect(markdown).toBe("![[_attachments/Quarterly brief.pdf]]");
  });

  test("keeps the explicit source path when no note is active", async () => {
    const savedAttachment = {
      extension: "zip",
      name: "bundle.zip",
      path: "_attachments/bundle.zip",
    };
    const { app, createBinary, getAvailablePathForAttachment, saveAttachment } =
      createApp({ activePath: null, savedAttachment });
    const { data, file } = createClipboardFile("bundle.zip", "application/zip");

    const markdown = await createSaveClipboardAttachment(
      app,
      "Journal/Daily.md",
    )(file);

    expect(saveAttachment).not.toHaveBeenCalled();
    expect(getAvailablePathForAttachment).toHaveBeenCalledWith(
      "bundle.zip",
      "Journal/Daily.md",
    );
    expect(createBinary).toHaveBeenCalledWith("_attachments/bundle.zip", data);
    expect(markdown).toBe("[[_attachments/bundle.zip]]");
  });

  test("adds a visible file name to an empty Markdown label for plain links", async () => {
    const savedAttachment = {
      extension: "zip",
      name: "bundle.zip",
      path: "Journal/attachments/bundle.zip",
    };
    const { app, generateMarkdownLink } = createApp({
      activePath: null,
      markdownLinks: true,
      savedAttachment,
    });
    const { file } = createClipboardFile("bundle.zip", "application/zip");

    const markdown = await createSaveClipboardAttachment(
      app,
      "Journal/Daily.md",
    )(file);

    expect(generateMarkdownLink).toHaveBeenCalledOnce();
    expect(generateMarkdownLink).toHaveBeenCalledWith(
      savedAttachment,
      "Journal/Daily.md",
    );
    expect(markdown).toBe("[bundle.zip](Journal/attachments/bundle.zip)");
  });

  test("falls back to the public source-aware API when saveAttachment is unavailable", async () => {
    const savedAttachment = {
      extension: "zip",
      name: "bundle.zip",
      path: "_attachments/bundle.zip",
    };
    const { app, createBinary, getAvailablePathForAttachment } = createApp({
      activePath: "Daily.md",
      savedAttachment,
    });

    delete (app as unknown as { saveAttachment?: unknown }).saveAttachment;

    const { data, file } = createClipboardFile("bundle.zip", "application/zip");
    const markdown = await createSaveClipboardAttachment(app, "Daily.md")(file);

    expect(getAvailablePathForAttachment).toHaveBeenCalledWith(
      "bundle.zip",
      "Daily.md",
    );
    expect(createBinary).toHaveBeenCalledWith("_attachments/bundle.zip", data);
    expect(markdown).toBe("[[_attachments/bundle.zip]]");
  });

  test("does not bypass a failing active-note attachment pipeline", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const savedAttachment = {
      extension: "png",
      name: "image.png",
      path: "_attachments/image.png",
    };
    const { app, createBinary, getAvailablePathForAttachment, saveAttachment } =
      createApp({ activePath: "Daily.md", savedAttachment });
    const { file } = createClipboardFile("image.png", "image/png");

    saveAttachment.mockRejectedValueOnce(new Error("plugin rejected paste"));

    const markdown = await createSaveClipboardAttachment(app, "Daily.md")(file);

    expect(markdown).toBeUndefined();
    expect(getAvailablePathForAttachment).not.toHaveBeenCalled();
    expect(createBinary).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
