const embeddableExtensions = new Set([
  // Images
  "avif",
  "bmp",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp",
  // Audio
  "3gp",
  "flac",
  "m4a",
  "mp3",
  "oga",
  "ogg",
  "opus",
  "wav",
  // Video
  "mkv",
  "mov",
  "mp4",
  "ogv",
  "webm",
  // Documents Obsidian can render inline
  "pdf",
]);

// Clipboard images arrive without a real file name; browsers fall back to
// these placeholders, and Obsidian renames them to "Pasted image <stamp>".
const placeholderImageNamePattern = /^image(\.[a-z0-9]+)?$/i;

const illegalFileNameCharacters = /[\\/:*?"<>|#^[\]]+/g;

export interface InputSelection {
  end: number;
  start: number;
}

export function getClipboardFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) {
    return [];
  }

  const files = Array.from<File>(dataTransfer.files);

  if (files.length > 0) {
    return files;
  }

  // Some platforms (notably mobile WebViews) only expose the payload through
  // `items`, so fall back to it before giving up on the paste.
  return Array.from<DataTransferItem>(dataTransfer.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

export function getFileExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");

  return lastDot <= 0 ? "" : fileName.slice(lastDot + 1).toLowerCase();
}

export function isEmbeddableExtension(extension: string) {
  return embeddableExtensions.has(extension.replace(/^\./, "").toLowerCase());
}

function getExtensionFromMimeType(mimeType: string) {
  const subtype = mimeType.split("/")[1]?.split(";")[0]?.trim();

  if (!subtype) {
    return "";
  }

  // "image/svg+xml" -> "svg"
  return subtype.split("+")[0]?.toLowerCase() ?? "";
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(illegalFileNameCharacters, "-")
    .replace(/^[\s.]+|[\s.]+$/g, "")
    .trim();
}

function pad(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

function formatTimestamp(now: Date) {
  return [
    pad(now.getFullYear(), 4),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

function isPlaceholderImageName(file: File) {
  return (
    file.type.startsWith("image/") &&
    placeholderImageNamePattern.test(file.name)
  );
}

export function createAttachmentFileName(file: File, now: Date) {
  const originalName = sanitizeFileName(file.name);

  if (originalName.length > 0 && !isPlaceholderImageName(file)) {
    return originalName;
  }

  const extension =
    getFileExtension(file.name) || getExtensionFromMimeType(file.type);

  return `Pasted image ${formatTimestamp(now)}${
    extension.length > 0 ? `.${extension}` : ""
  }`;
}

export function toAttachmentMarkdown(link: string, extension: string) {
  return isEmbeddableExtension(extension) ? `!${link}` : link;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function insertTextIntoInput(
  input: HTMLInputElement,
  text: string,
  selection: InputSelection,
) {
  const { value } = input;
  // The selection is captured before the attachment is written to the vault,
  // so it can point past the end of the value the user typed meanwhile.
  const start = clamp(selection.start, 0, value.length);
  const end = clamp(selection.end, start, value.length);
  const cursor = start + text.length;

  input.value = value.slice(0, start) + text + value.slice(end);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.setSelectionRange(cursor, cursor);
  input.focus();
}
