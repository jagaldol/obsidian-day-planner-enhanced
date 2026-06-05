/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { App, Component, MarkdownRenderer } from "obsidian";

export const createRenderMarkdown =
  (app: App) => (el: HTMLElement, markdown: string) => {
    const loader = new Component();

    el.empty();

    // TODO: investigate why `await` doesn't work as expected here
    // TODO: inconsistent link behavior is probably here. We need to pass file path to renderer from each task
    MarkdownRenderer.render(app, markdown, el, "/", loader).then(
      () => loader.load(),
      (error) => console.error(`Failed to render markdown. `, error),
    );

    return () => loader.unload();
  };
