/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
// noinspection JSPotentiallyInvalidUsageOfClassThis

import { Effect } from "effect";
import { type ListItemCache } from "obsidian";
import { isNotVoid } from "typed-assert";

import {
  createMarkdownListTokens,
  getIndentationForListParagraph,
} from "../util/markdown";
import { createLineToChildrenLookup } from "../util/metadata";

import type { ListPropsParser } from "./list-props-parser";
import { MetadataCacheFacade } from "./metadata-cache-facade";
import type { VaultFacade } from "./vault-facade";
import type { WorkspaceFacade } from "./workspace-facade";

export { runWithNoticeOnError } from "../util/effect";

export interface ListItemLocation {
  path: string;
  line: number;
}

export interface EditableNestedListItem {
  text: string;
  symbol: string;
  status?: string;
  task?: string;
  children?: EditableNestedListItem[];
}

function getListItemSubtree(root: ListItemCache, listItems: ListItemCache[]) {
  const childrenByParentLine = createLineToChildrenLookup(listItems);
  const subtree = [root];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();

    isNotVoid(current);

    const children = childrenByParentLine[current.position.start.line] || [];

    subtree.push(...children);
    stack.push(...children);
  }

  return subtree;
}

function getTextRemovalEndOffset(contents: string, listItems: ListItemCache[]) {
  const contentEndOffset = Math.max(
    ...listItems.map((item) => item.position.end.offset),
  );

  if (contents.slice(contentEndOffset, contentEndOffset + 2) === "\r\n") {
    return contentEndOffset + 2;
  }

  if (contents[contentEndOffset] === "\n") {
    return contentEndOffset + 1;
  }

  return contentEndOffset;
}

function getLineIndentation(line: string) {
  return line.match(/^\s*/)?.[0] ?? "";
}

const nestedListItemIndentationStep = "    ";

function getFirstLineAndRest(text: string) {
  const [firstLine = "", ...rest] = text.split("\n");

  return { firstLine, rest };
}

function serializeNestedListItem(
  item: EditableNestedListItem,
  indentation: string,
  indentationStep: string,
): string[] {
  const { firstLine, rest } = getFirstLineAndRest(item.text);
  const paragraphIndentation = indentation + getIndentationForListParagraph();
  const lines = [
    `${indentation}${createMarkdownListTokens(item)} ${firstLine}`,
    ...rest.map((line) => `${paragraphIndentation}${line}`),
  ];

  for (const child of item.children ?? []) {
    lines.push(
      ...serializeNestedListItem(
        child,
        indentation + indentationStep,
        indentationStep,
      ),
    );
  }

  return lines;
}

function serializeNestedListItems(
  items: EditableNestedListItem[],
  indentation: string,
  indentationStep: string,
) {
  return items.flatMap((item) =>
    serializeNestedListItem(item, indentation, indentationStep),
  );
}

export class ListItemEntryEditor {
  removeAtLocation = ({ path, line }: ListItemLocation) =>
    Effect.gen(this, function* () {
      const listItem = yield* this.metadataCacheFacade.getListItemEffect(
        path,
        line,
      );
      const listItems =
        yield* this.metadataCacheFacade.getListItemsEffect(path);
      const subtree = getListItemSubtree(listItem, listItems);

      yield* Effect.tryPromise({
        try: () =>
          this.vaultFacade.editFile(path, (contents) => {
            const startOffset = listItem.position.start.offset;
            const endOffset = getTextRemovalEndOffset(contents, subtree);

            return contents.slice(0, startOffset) + contents.slice(endOffset);
          }),
        catch: (error) =>
          new Error(`Could not remove list item at ${path}:${line}`, {
            cause: error,
          }),
      });
    });

  replaceNestedItemsAtLocation = (
    { path, line }: ListItemLocation,
    children: EditableNestedListItem[],
  ) =>
    Effect.gen(this, function* () {
      const listItem = yield* this.metadataCacheFacade.getListItemEffect(
        path,
        line,
      );
      const listItems =
        yield* this.metadataCacheFacade.getListItemsEffect(path);
      const childrenByParentLine = createLineToChildrenLookup(listItems);
      const existingChildren =
        childrenByParentLine[listItem.position.start.line] ?? [];

      yield* Effect.tryPromise({
        try: () =>
          this.vaultFacade.editFile(path, (contents) => {
            const lines = contents.split("\n");
            const parentLine = lines[listItem.position.start.line];

            isNotVoid(parentLine);

            const parentIndentation = getLineIndentation(parentLine);
            const childIndentation =
              parentIndentation + nestedListItemIndentationStep;
            const replacementLines = serializeNestedListItems(
              children,
              childIndentation,
              nestedListItemIndentationStep,
            );

            if (existingChildren.length === 0) {
              if (replacementLines.length === 0) {
                return contents;
              }

              lines.splice(
                listItem.position.end.line + 1,
                0,
                ...replacementLines,
              );

              return lines.join("\n");
            }

            const descendantLines = existingChildren.flatMap((child) =>
              getListItemSubtree(child, listItems),
            );
            const startLine = existingChildren[0]?.position.start.line;

            isNotVoid(startLine);

            const endLine = Math.max(
              ...descendantLines.map((item) => item.position.end.line),
            );

            lines.splice(
              startLine,
              endLine - startLine + 1,
              ...replacementLines,
            );

            return lines.join("\n");
          }),
        catch: (error) =>
          new Error(`Could not replace nested list items at ${path}:${line}`, {
            cause: error,
          }),
      });
    });

  constructor(
    _workspaceFacade: WorkspaceFacade,
    private readonly vaultFacade: VaultFacade,
    private readonly metadataCacheFacade: MetadataCacheFacade,
    _listPropsParser: ListPropsParser,
  ) {}
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
