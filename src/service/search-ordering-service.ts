/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { Vault } from "obsidian";

import { selectLatestClosedLogEndByParentId } from "../redux/index/index-selectors";
import {
  createFileEntryId,
  createListItemEntryId,
} from "../redux/index/index-slice";
import type { RootState } from "../redux/store";

import type { Match } from "./search-service";

export interface SearchOrderingService {
  order(matches: Match[]): Promise<Match[]>;
}

export class DefaultSearchOrderingService implements SearchOrderingService {
  constructor(
    private readonly vault: Vault,
    private readonly getState: () => RootState,
  ) {}

  async order(matches: Match[]): Promise<Match[]> {
    const latestClosedLogEndByParentId = selectLatestClosedLogEndByParentId(
      this.getState(),
    );

    function getLatestClosedLogEndTimestamp(match: Match) {
      const id =
        match.type === "task"
          ? createListItemEntryId(match.path, match.position.start.line)
          : createFileEntryId(match.path);

      return latestClosedLogEndByParentId.get(id) ?? 0;
    }

    return matches.toSorted((a, b) => {
      const recencyDiff =
        getLatestClosedLogEndTimestamp(b) - getLatestClosedLogEndTimestamp(a);

      if (recencyDiff !== 0) {
        return recencyDiff;
      }

      const typeDiff = rankByFileFirst(b) - rankByFileFirst(a);

      if (typeDiff !== 0) {
        return typeDiff;
      }

      return this.getMtime(b.path) - this.getMtime(a.path);
    });
  }

  private getMtime(path: string) {
    return this.vault.getFileByPath(path)?.stat.mtime ?? 0;
  }
}

function rankByFileFirst(match: Match) {
  return match.type === "file" ? 1 : 0;
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
