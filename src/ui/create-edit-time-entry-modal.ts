/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { App, Modal } from "obsidian";
import { mount, unmount } from "svelte";

import { clockFormat } from "../constants";
import type { LogEntry } from "../redux/index/index-slice";
import type { LogEntryEditor } from "../service/log-entry-editor";
import type { LogTimeBlock } from "../time-block-types";
import { runWithNoticeOnError } from "../util/effect";
import { getFirstLine } from "../util/markdown";
import { getEndTime } from "../util/time-block-utils";

import TimeEntryEditModal from "./components/time-entry-edit-modal.svelte";

export function createEditTimeEntryModalCreator(
  app: App,
  logEntryEditor: LogEntryEditor,
) {
  // todo: separate LogTimeBlockView (clamped) & LogTimeBlock
  return (timeBlock: LogTimeBlock, logEntry?: LogEntry) => {
    const initialStart = logEntry
      ? logEntry.start
      : timeBlock.startTime.format(clockFormat);
    const initialEnd = logEntry
      ? (logEntry.end ?? window.moment().format(clockFormat))
      : timeBlock.durationMinutes
        ? getEndTime(timeBlock).format(clockFormat)
        : window.moment().format(clockFormat);

    const modal = new Modal(app).setTitle(
      `Edit time entry: ${getFirstLine(timeBlock.text)}`,
    );

    const component = mount(TimeEntryEditModal, {
      target: modal.contentEl,
      props: {
        initialStart,
        initialEnd,
        onConfirm: async ({ start, end }: { start: string; end?: string }) => {
          await runWithNoticeOnError(
            logEntry
              ? logEntryEditor.editClock(timeBlock, {
                  logIndex: logEntry.logIndex,
                  originalStart: logEntry.start,
                  patch: { start, end },
                })
              : logEntryEditor.editLastClock(timeBlock, { start, end }),
          );

          modal.close();
        },
        onCancel: () => modal.close(),
      },
    });

    modal.onClose = async () => {
      try {
        await unmount(component);
      } catch (error) {
        console.error(error);
      }
    };

    modal.open();
  };
}

export type OpenEditTimeEntryModal = ReturnType<
  typeof createEditTimeEntryModalCreator
>;
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
