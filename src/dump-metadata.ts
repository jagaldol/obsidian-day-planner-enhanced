/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { normalizePath, type App } from "obsidian";

export function createDumpMetadataCommand(app: App) {
  return async () => {
    const metadataDumpPath = normalizePath(
      `${app.vault.configDir}/plugins/day-planner-enhanced/fixtures/metadata-dump`,
    );

    const exists = await app.vault.adapter.exists(metadataDumpPath);

    if (exists) {
      await app.vault.adapter.rmdir(metadataDumpPath, true);
    }

    await app.vault.adapter.mkdir(metadataDumpPath);

    const dump = {
      cachedMetadata: Object.fromEntries(
        app.vault
          .getMarkdownFiles()
          .map((it) => [it.path, app.metadataCache.getFileCache(it)]),
      ),
    };

    await app.vault.create(
      `${metadataDumpPath}/tasks.json`,
      JSON.stringify(dump, null, 2),
    );
  };
}
