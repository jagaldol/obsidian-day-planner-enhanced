/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type {
  Editor,
  MarkdownFileInfo,
  MarkdownView,
  Menu,
  MetadataCache,
} from "obsidian";

import type { ListPropsParser } from "../service/list-props-parser";
import type { LogEntryEditor } from "../service/log-entry-editor";
import type { MetadataCacheFacade } from "../service/metadata-cache-facade";
import { runWithNoticeOnError } from "../util/effect";
import { isTaskCache } from "../util/metadata";
import { isWithOpenClock } from "../util/props";

export const createEditorMenuCallback =
  (props: {
    logEntryEditor: LogEntryEditor;
    metadataCacheFacade: MetadataCacheFacade;
    listPropsParser: ListPropsParser;
    metadataCache: MetadataCache;
    isTimeTrackerEnabled: () => boolean;
  }) =>
  async (menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
    const {
      logEntryEditor,
      metadataCacheFacade,
      metadataCache,
      listPropsParser,
      isTimeTrackerEnabled,
    } = props;

    if (!isTimeTrackerEnabled()) {
      return;
    }

    const path = info.file?.path;

    if (!path) {
      return;
    }

    const line = editor.getCursor().line;
    const fileCache = metadataCache.getCache(path);
    const listItemCache = metadataCacheFacade.getListItem(path, line);

    if (!fileCache || !listItemCache || !isTaskCache(listItemCache)) {
      return;
    }

    const contents = editor.getValue();
    const propsForFile = listPropsParser.getListPropsFromFile(
      contents,
      fileCache,
    );

    const propsForLine = propsForFile?.[line];

    menu.addSeparator();

    if (isWithOpenClock(propsForLine?.parsed)) {
      menu.addItem((item) => {
        item
          .setTitle("Clock out")
          .setIcon("square")
          .onClick(() =>
            runWithNoticeOnError(logEntryEditor.clockOutUnderCursor()),
          );
      });

      menu.addItem((item) => {
        item
          .setTitle("Cancel clock")
          .setIcon("trash")
          .onClick(() =>
            runWithNoticeOnError(logEntryEditor.cancelClockUnderCursor()),
          );
      });
    } else {
      menu.addItem((item) => {
        item
          .setTitle("Clock in")
          .setIcon("play")
          .onClick(() =>
            runWithNoticeOnError(logEntryEditor.clockInUnderCursor()),
          );
      });
    }
  };
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
