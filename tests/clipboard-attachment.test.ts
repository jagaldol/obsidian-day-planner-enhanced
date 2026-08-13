import { describe, expect, test } from "vitest";

import {
  createAttachmentFileName,
  getClipboardFiles,
  getFileExtension,
  insertTextIntoInput,
  isEmbeddableExtension,
  toAttachmentMarkdown,
} from "../src/util/clipboard-attachment";

function createFile(name: string, type: string) {
  return new File(["content"], name, { type });
}

function createDataTransfer(
  files: File[],
  items: { file: File | null; kind: string }[] = [],
): DataTransfer {
  return {
    files,
    items: items.map((item) => ({
      kind: item.kind,
      getAsFile: () => item.file,
    })),
  } as unknown as DataTransfer;
}

const pasteMoment = new Date(2023, 0, 2, 3, 4, 5);

describe("getClipboardFiles", () => {
  test("returns nothing without a clipboard payload", () => {
    expect(getClipboardFiles(null)).toEqual([]);
    expect(getClipboardFiles(createDataTransfer([]))).toEqual([]);
  });

  test("reads files straight off the clipboard", () => {
    const file = createFile("report.pdf", "application/pdf");

    expect(getClipboardFiles(createDataTransfer([file]))).toEqual([file]);
  });

  test("reads files exposed only through clipboard items", () => {
    const file = createFile("image.png", "image/png");
    const dataTransfer = createDataTransfer(
      [],
      [
        { file: null, kind: "string" },
        { file, kind: "file" },
      ],
    );

    expect(getClipboardFiles(dataTransfer)).toEqual([file]);
  });
});

describe("createAttachmentFileName", () => {
  test("keeps the name of a file copied from the file system", () => {
    expect(
      createAttachmentFileName(
        createFile("Quarterly report.pdf", "application/pdf"),
        pasteMoment,
      ),
    ).toBe("Quarterly report.pdf");
  });

  test("names clipboard images after the moment they were pasted", () => {
    expect(
      createAttachmentFileName(
        createFile("image.png", "image/png"),
        pasteMoment,
      ),
    ).toBe("Pasted image 20230102030405.png");
  });

  test("derives the extension from the mime type when the name has none", () => {
    expect(
      createAttachmentFileName(createFile("", "image/svg+xml"), pasteMoment),
    ).toBe("Pasted image 20230102030405.svg");
  });

  test("keeps an image file that only happens to be named like a placeholder", () => {
    expect(
      createAttachmentFileName(
        createFile("image.png.zip", "application/zip"),
        pasteMoment,
      ),
    ).toBe("image.png.zip");
  });

  test("strips characters Obsidian cannot put in a file name", () => {
    expect(
      createAttachmentFileName(
        createFile("re:port [draft]#1.pdf", "application/pdf"),
        pasteMoment,
      ),
    ).toBe("re-port -draft-1.pdf");
  });
});

describe("attachment markdown", () => {
  test("reads the extension off a file name", () => {
    expect(getFileExtension("Pasted image 20230102030405.PNG")).toBe("png");
    expect(getFileExtension("archive.tar.gz")).toBe("gz");
    expect(getFileExtension("no-extension")).toBe("");
    expect(getFileExtension(".hidden")).toBe("");
  });

  test("embeds what Obsidian can render inline", () => {
    expect(isEmbeddableExtension("png")).toBe(true);
    expect(isEmbeddableExtension("PDF")).toBe(true);
    expect(isEmbeddableExtension(".mp3")).toBe(true);
    expect(isEmbeddableExtension("zip")).toBe(false);
    expect(isEmbeddableExtension("docx")).toBe(false);
  });

  test("prefixes embeddable attachments with an exclamation mark", () => {
    expect(toAttachmentMarkdown("[[Files/note.png]]", "png")).toBe(
      "![[Files/note.png]]",
    );
    expect(toAttachmentMarkdown("[[Files/bundle.zip]]", "zip")).toBe(
      "[[Files/bundle.zip]]",
    );
  });
});

describe("insertTextIntoInput", () => {
  function createInput(value: string) {
    const input = document.createElement("input");

    input.value = value;
    document.body.appendChild(input);

    return input;
  }

  test("inserts at the cursor and reports the change", () => {
    const input = createInput("before after");
    const inputEvents: string[] = [];

    input.addEventListener("input", () => inputEvents.push(input.value));
    insertTextIntoInput(input, "![[a.png]]", { start: 7, end: 7 });

    expect(input.value).toBe("before ![[a.png]]after");
    expect(inputEvents).toEqual(["before ![[a.png]]after"]);
    expect(input.selectionStart).toBe(17);
    expect(input.selectionEnd).toBe(17);
  });

  test("replaces the selected range", () => {
    const input = createInput("before after");

    insertTextIntoInput(input, "![[a.png]]", { start: 0, end: 6 });

    expect(input.value).toBe("![[a.png]] after");
  });

  test("clamps a selection captured before the value shrank", () => {
    const input = createInput("ab");

    insertTextIntoInput(input, "![[a.png]]", { start: 40, end: 80 });

    expect(input.value).toBe("ab![[a.png]]");
  });
});
