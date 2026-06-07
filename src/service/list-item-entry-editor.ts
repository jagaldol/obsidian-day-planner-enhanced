/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
// noinspection JSPotentiallyInvalidUsageOfClassThis

import { Effect, Either, pipe } from "effect";
import { type ListItemCache, Notice } from "obsidian";
import { isNotVoid } from "typed-assert";

import { locToEditorPosition } from "../util/editor";
import { getErrorMessage } from "../util/error";
import {
  createMarkdownListTokens,
  getIndentationForListParagraph,
} from "../util/markdown";
import { createLineToChildrenLookup } from "../util/metadata";
import {
  addOpenClock,
  cancelOpenClock,
  clockOut,
  createPropsWithOpenClock,
  editLogEntry,
  type Props,
  toIndentedMarkdown,
} from "../util/props";

import type { ListPropsParseResult } from "./list-props-parser";
import type { ListPropsParser } from "./list-props-parser";
import { MetadataCacheFacade } from "./metadata-cache-facade";
import type { VaultFacade } from "./vault-facade";
import { WorkspaceFacade } from "./workspace-facade";

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

function getIndentationStep(
  parentIndentation: string,
  childIndentation: string,
) {
  if (childIndentation.startsWith(parentIndentation)) {
    const indentationStep = childIndentation.slice(parentIndentation.length);

    if (indentationStep.length > 0) {
      return indentationStep;
    }
  }

  return "  ";
}

export const runWithNoticeOnError = <A, E>(
  program: Effect.Effect<A, E>,
): Promise<void> =>
  pipe(
    program,
    Effect.asVoid,
    Effect.catchAll((error) =>
      Effect.sync(() => {
        new Notice(String(error));

        console.error(error);
      }),
    ),
    Effect.runPromise,
  );

export class ListItemEntryEditor {
  private prepareEdit = (
    path: string,
    line: number,
    editFn: (props?: Props) => Props,
  ) =>
    Effect.gen(this, function* () {
      const listItem = yield* this.metadataCacheFacade.getListItemEffect(
        path,
        line,
      );

      if (!listItem.task) {
        return yield* Effect.fail(
          new Error(
            `Cannot add props to an item that's not a task at ${path}:${line}`,
          ),
        );
      }

      const baseProps = yield* this.findListProps(path, line);

      const editedProps = yield* Effect.try({
        try: () => editFn(baseProps?.parsed),
        catch: (error) =>
          new Error(`Could not edit props. Cause: ${getErrorMessage(error)}`, {
            cause: error,
          }),
      });

      const updatedProps = yield* toIndentedMarkdown(
        editedProps,
        listItem.position.start.col,
      );

      return { listItem, baseProps, updatedProps };
    });

  editProps = (props: {
    path: string;
    line: number;
    editFn: (props?: Props) => Props;
  }) => {
    const { path, line, editFn } = props;

    return Effect.gen(this, function* () {
      const { listItem, baseProps, updatedProps } = yield* this.prepareEdit(
        path,
        line,
        editFn,
      );

      yield* Effect.tryPromise({
        try: () =>
          this.vaultFacade.editFile(path, (contents) => {
            if (baseProps) {
              return (
                contents.slice(0, baseProps.position.start.offset) +
                updatedProps +
                contents.slice(baseProps.position.end.offset)
              );
            }

            return (
              contents.slice(0, listItem.position.end.offset) +
              "\n" +
              updatedProps +
              contents.slice(listItem.position.end.offset)
            );
          }),
        catch: (error) =>
          new Error(`Could not edit file ${path}`, { cause: error }),
      });
    });
  };

  private findListProps = (
    path: string,
    line: number,
  ): Effect.Effect<ListPropsParseResult | undefined, Error> =>
    Effect.tryPromise({
      try: async () => {
        const parseResult = await this.listPropsParser.parse(path);

        return parseResult?.[line];
      },
      catch: (error) =>
        new Error(`Failed to parse list props at ${path}:${line}`, {
          cause: error,
        }),
    });

  editPropsAtLocation = ({
    path,
    line,
    editFn,
  }: ListItemLocation & { editFn: (props: Props) => Props }) => {
    return this.editProps({
      path,
      line,
      editFn: (props) => {
        isNotVoid(props, `No list props at ${path}:${line}`);

        return editFn(props);
      },
    });
  };

  clockInAtLocation = (location: ListItemLocation) =>
    this.editPropsAtLocation({ ...location, editFn: addOpenClock });

  clockOutAtLocation = (location: ListItemLocation) =>
    this.editPropsAtLocation({ ...location, editFn: clockOut });

  cancelClockAtLocation = (location: ListItemLocation) =>
    this.editPropsAtLocation({ ...location, editFn: cancelOpenClock });

  editLastClockAtLocation = (
    location: ListItemLocation,
    patch: { start?: string; end?: string },
  ) =>
    this.editPropsAtLocation({
      ...location,
      editFn: (props) => {
        const log = props.planner?.log;

        if (!log?.length) {
          throw new Error("No log entries");
        }

        const last = log[log.length - 1];

        return editLogEntry(props, { originalStart: last.start, patch });
      },
    });

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
            const firstExistingChild = existingChildren[0];
            const firstExistingChildLine =
              firstExistingChild === undefined
                ? undefined
                : lines[firstExistingChild.position.start.line];
            const parentLine = lines[listItem.position.start.line];

            isNotVoid(parentLine);

            const parentIndentation = getLineIndentation(parentLine);
            const childIndentation =
              firstExistingChildLine === undefined
                ? `${parentIndentation}  `
                : getLineIndentation(firstExistingChildLine);
            const indentationStep = getIndentationStep(
              parentIndentation,
              childIndentation,
            );
            const replacementLines = serializeNestedListItems(
              children,
              childIndentation,
              indentationStep,
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

  clockInUnderCursor = () =>
    this.updateListPropsUnderCursor((props) =>
      props ? addOpenClock(props) : createPropsWithOpenClock(),
    );

  clockOutUnderCursor = () =>
    this.updateListPropsUnderCursor((props) => {
      isNotVoid(props, "There are no props under cursor");

      return clockOut(props);
    });

  cancelClockUnderCursor = () =>
    this.updateListPropsUnderCursor((props) => {
      isNotVoid(props, "There are no props under cursor");

      return cancelOpenClock(props);
    });

  constructor(
    private readonly workspaceFacade: WorkspaceFacade,
    private readonly vaultFacade: VaultFacade,
    private readonly metadataCacheFacade: MetadataCacheFacade,
    private readonly listPropsParser: ListPropsParser,
  ) {}

  private updateListPropsUnderCursor = (updateFn: (props?: Props) => Props) =>
    pipe(
      Effect.gen(this, function* () {
        const { path, line } = yield* Either.try({
          try: () => this.workspaceFacade.getLastCaretLocation(),
          catch: (error) =>
            new Error("Failed to get caret location", { cause: error }),
        });

        const { listItem, baseProps, updatedProps } = yield* this.prepareEdit(
          path,
          line,
          updateFn,
        );

        const view = yield* Either.try({
          try: () => this.workspaceFacade.getActiveMarkdownView(),
          catch: (error) =>
            new Error("Could not get active markdown view", { cause: error }),
        });

        if (baseProps) {
          return view.editor.replaceRange(
            updatedProps,
            locToEditorPosition(baseProps.position.start),
            locToEditorPosition(baseProps.position.end),
          );
        }

        const afterFirstLineEditorPos = {
          line: listItem.position.start.line + 1,
          ch: 0,
        };

        let newlyAddedProps = updatedProps + "\n";

        if (listItem.position.start.line === view.editor.lastLine()) {
          newlyAddedProps = "\n" + newlyAddedProps;
        }

        return view.editor.replaceRange(
          newlyAddedProps,
          afterFirstLineEditorPos,
          afterFirstLineEditorPos,
        );
      }),
      runWithNoticeOnError,
    );
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
