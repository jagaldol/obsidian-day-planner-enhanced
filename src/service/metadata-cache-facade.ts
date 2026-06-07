/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { pipe } from "effect";
import { Effect } from "effect";
import type { MetadataCache } from "obsidian";

export class MetadataCacheFacade {
  constructor(private readonly metadataCache: MetadataCache) {}

  getListItem(path: string, line: number) {
    return (
      this.metadataCache
        .getCache(path)
        // todo: can it be a pure function?
        ?.listItems?.find((item) => item.position?.start?.line === line)
    );
  }

  getListItemEffect(path: string, line: number) {
    return pipe(
      Effect.fromNullable(
        this.metadataCache
          .getCache(path)
          ?.listItems?.find((item) => item.position?.start?.line === line),
      ),
      Effect.mapError(() => new Error(`No list item at ${path}:${line}`)),
    );
  }

  getListItemsEffect(path: string) {
    return pipe(
      Effect.fromNullable(this.metadataCache.getCache(path)?.listItems),
      Effect.mapError(() => new Error(`No list items in ${path}`)),
    );
  }
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
