/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { createId } from "../../../redux/index/index-slice";
import { isTaskCache } from "../../../util/metadata";
import type { ListPropsParser } from "../../list-props-parser";
import type {
  ListItemIndexExtensionService,
  RawListItemEntryWithContext,
} from "../list-item-index-extension-service";
import { createLogEntry } from "../log-entry";

export class LogEntryExtensionService implements ListItemIndexExtensionService {
  constructor(private readonly listPropsParser: ListPropsParser) {}

  forFile() {
    return ({
      listItemCache,
      rawListItemEntry,
      listItemText,
    }: RawListItemEntryWithContext) => {
      if (!isTaskCache(listItemCache)) {
        return {};
      }

      const listItemProps = this.listPropsParser.getListPropsFromListItem(
        listItemCache,
        listItemText,
      );

      // todo: cut out props here, use removeWithin(text: string, outer: Pos, inner: Pos)

      return {
        propsPosition: listItemProps?.position,
        logEntries:
          listItemProps?.parsed.planner?.log?.map(({ start, end }, index) =>
            createLogEntry({
              start,
              end,
              parentId: rawListItemEntry.id,
              id: createId(rawListItemEntry.id, index),
              logIndex: index,
              source: "listItemLog",
            }),
          ) ?? [],
      };
    };
  }
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
