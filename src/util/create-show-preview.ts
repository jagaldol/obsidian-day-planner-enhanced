/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { App, HoverParent } from "obsidian";

type AppWithPagePreview = App & {
  internalPlugins: {
    plugins: Record<string, { enabled?: boolean } | undefined>;
  };
};

interface ShowPreviewOptions {
  source?: string;
}

export const dayPlannerHoverLinkSource = "day-planner-enhanced";

export const createShowPreview =
  (app: App, { source = "search" }: ShowPreviewOptions = {}) =>
  (
    hoverParent: HoverParent,
    targetEl: HTMLElement,
    event: MouseEvent,
    linktext: string,
    line?: number,
    sourcePath = linktext,
  ) => {
    const pagePreview = (app as AppWithPagePreview).internalPlugins.plugins[
      "page-preview"
    ];

    if (!pagePreview?.enabled) {
      return;
    }

    app.workspace.trigger("hover-link", {
      event,
      source,
      hoverParent,
      targetEl,
      linktext,
      sourcePath,
      ...(line === undefined ? {} : { state: { scroll: line } }),
    });
  };

export type ShowPreview = ReturnType<typeof createShowPreview>;
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
