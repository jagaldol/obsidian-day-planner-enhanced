/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { App } from "obsidian";

type AppWithPagePreview = App & {
  internalPlugins: {
    plugins: Record<string, { enabled?: boolean } | undefined>;
  };
};

export const createShowPreview =
  (app: App) =>
  (el: HTMLElement, event: MouseEvent, path: string, line = 0) => {
    const pagePreview = (app as AppWithPagePreview).internalPlugins.plugins[
      "page-preview"
    ];

    if (!pagePreview?.enabled) {
      return;
    }

    app.workspace.trigger("hover-link", {
      event,
      source: "search",
      hoverParent: el,
      targetEl: el,
      linktext: path,
      state: { scroll: line },
    });
  };

export type ShowPreview = ReturnType<typeof createShowPreview>;
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
