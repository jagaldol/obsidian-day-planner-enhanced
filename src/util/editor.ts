/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { Editor, Loc } from "obsidian";

export function selectText(editor: Editor, text: string) {
  const startOffset = editor.getValue().lastIndexOf(text);
  const endOffset = startOffset + text.length;

  editor.setSelection(
    editor.offsetToPos(startOffset),
    editor.offsetToPos(endOffset),
  );
}
export function locToEditorPosition({ line, col }: Loc) {
  return { line, ch: col };
}
