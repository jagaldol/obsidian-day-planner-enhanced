/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { createFileEntryId, createId } from "../../redux/index/index-slice";
import { removeMarkdownExtension } from "../../util/markdown";
import { type Props, propsSchema } from "../../util/props";

import type { FileWithMetadata, IndexService } from "./index-service";
import { createLogEntry } from "./log-entry";

function getBasename(path: string) {
  return removeMarkdownExtension(path.slice(path.lastIndexOf("/") + 1));
}

export class FrontmatterLogIndexService implements IndexService {
  index(props: FileWithMetadata) {
    const { path, metadata } = props;

    if (!metadata.frontmatter) {
      return {};
    }

    let parsed: Props;

    try {
      parsed = propsSchema.parse(metadata.frontmatter);
    } catch (error) {
      console.error(error);

      return {};
    }

    const log = parsed.planner?.log ?? [];

    if (log.length === 0) {
      return {};
    }

    const fileEntryId = createFileEntryId(path);

    const logEntries = log.map(({ start, end }, index) =>
      createLogEntry({
        start,
        end,
        parentId: fileEntryId,
        id: createId(fileEntryId, index),
        logIndex: index,
        source: "frontmatterLog",
      }),
    );

    return {
      fileEntries: [{ id: fileEntryId, text: getBasename(path), path }],
      logEntries,
    };
  }
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
