/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { App, Component, Keymap, MarkdownRenderer } from "obsidian";

import { isElement } from "./dom";

function getInternalLink(event: MouseEvent, container: HTMLElement) {
  if (!isElement(event.target)) {
    return;
  }

  const link = event.target.closest("a.internal-link");

  if (!link || !container.contains(link)) {
    return;
  }

  return link;
}

export const createRenderMarkdown =
  (app: App) => (el: HTMLElement, markdown: string, sourcePath: string) => {
    const loader = new Component();

    el.empty();

    // TODO: investigate why `await` doesn't work as expected here
    MarkdownRenderer.render(app, markdown, el, sourcePath, loader).then(
      () => loader.load(),
      (error) => console.error(`Failed to render markdown. `, error),
    );

    const openInternalLink = (event: MouseEvent) => {
      if (![0, 1].includes(event.button)) {
        return;
      }

      const link = getInternalLink(event, el);
      const linkText = link?.getAttribute("data-href");

      if (!linkText) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      app.workspace
        .openLinkText(linkText, sourcePath, Keymap.isModEvent(event))
        .catch((error) =>
          console.error(`Failed to open internal markdown link. `, error),
        );
    };

    el.addEventListener("click", openInternalLink, true);
    el.addEventListener("auxclick", openInternalLink, true);

    return () => {
      el.removeEventListener("click", openInternalLink, true);
      el.removeEventListener("auxclick", openInternalLink, true);
      loader.unload();
    };
  };
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
