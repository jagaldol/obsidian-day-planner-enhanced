# AGENTS.md

Guidance for AI agents working in the `Day Planner Enhanced` repository.

## Repository Role

- This repository is the source workspace for `Day Planner Enhanced`, an independent MIT-licensed fork of `ivan-lednev/obsidian-day-planner`.
- `origin` is the enhanced fork: `https://github.com/jagaldol/obsidian-day-planner-enhanced.git`.
- `upstream` is the original project: `https://github.com/ivan-lednev/obsidian-day-planner.git`.
- The plugin identity is:
  - plugin id: `day-planner-enhanced`
  - plugin name: `Day Planner Enhanced`
  - package name: `obsidian-day-planner-enhanced`
- Keep changes small, reviewable, and compatible with future upstream merges when possible.

## Language And Communication

- Respond to the user in Korean by default.
- Keep explanations concrete and source-backed. When describing behavior, point to the relevant source files and validation results.
- Separate confirmed behavior from inference, especially when comparing source code, generated bundles, and live Obsidian behavior.
- Do not include personal local paths, vault names, screenshots, or private environment details in committed files.

## Editing Rules

- Do not manually edit generated bundle output such as built `main.js` as the primary implementation path.
- Make behavior changes in `src/` and let `npm run build` generate plugin artifacts.
- Keep edits scoped. Avoid unrelated visual restyling, dependency changes, or broad refactors unless directly required.
- If changing settings, update all relevant places together:
  - `src/settings.ts`
  - `src/ui/components/settings-controls.svelte`
  - tests and user-facing documentation that depend on the setting
- If changing plugin identity or release metadata, update the relevant metadata together:
  - `manifest.json`
  - `package.json`
  - `package-lock.json`
  - `versions.json`
  - README and GitHub issue/release references when user-facing
- Treat `AGENTS.md` as a commit-ready repo-local file. Keep it generic and free of machine-specific paths.

## Development Commands

- Install dependencies if needed: `npm install`
- Build production bundle: `npm run build`
- Typecheck only: `npm run typescript`
- Unit/integration tests: `npm run test`
- Full validation: `npm run lint`

`npm run lint` runs prettier, eslint, stylelint, TypeScript, svelte-check, and tests concurrently. For narrow changes, run targeted tests first, then broaden validation.

## Important Source Areas

- Timeline task selection and grouping:
  - `src/ui/hooks/use-edit/use-edit-context.ts`
  - `src/util/task-utils.ts`
  - `combinedTasks`
  - `dayToDisplayedTasks`
  - `getDisplayedTasksForTimeline`
- Rendered markdown and nested schedule content:
  - `src/ui/components/rendered-markdown.svelte`
  - `src/util/markdown.ts`
  - `toRenderableMarkdown`
  - `getIndentedText`
- Timeline block shell, separators, current state, and selection styling:
  - `src/ui/components/time-block-base.svelte`
  - `src/ui/components/positioned-time-block.svelte`
  - `src/ui/components/local-time-block.svelte`
  - `src/ui/components/timeline.svelte`
  - `src/ui/components/needle.svelte`
  - `src/ui/hooks/use-color.svelte.ts`
- Plugin identity and release metadata:
  - `manifest.json`
  - `package.json`
  - `versions.json`
  - `README.md`
  - `.github/ISSUE_TEMPLATE/`

## Product Direction

Day Planner Enhanced prioritizes a readable timeline UI for nested schedules.

- Parent timed blocks remain the main timeline blocks.
- Timed child items nested under a timed parent render inside the parent block when full list content is enabled.
- Nested timed child items must not also render as separate overlapping timeline blocks.
- Untimed child items under the same parent remain visible inside the parent block.
- Time ranges must remain visible; do not drop the `HH:mm - HH:mm` information.
- Compact and zoom-level behavior should preserve readability and avoid content overflow.
- Current time and future timeline accents use the green visual language; selected blocks remain blue.
- Avoid meaningless keyword-based icon mapping. Prefer no icon over hardcoded semantic guesses.

## Obsidian Vault Integration

- Treat vault installation as a separate explicit integration step.
- Do not hardcode local vault paths in source, docs, tests, or committed instructions.
- Build the plugin before installing generated artifacts into any vault.
- Install this plugin under `.obsidian/plugins/day-planner-enhanced/` so it remains separate from the original Day Planner plugin.
- Restart or reload Obsidian before visual verification after plugin identity or generated artifacts change.
- Inspect the actual Obsidian timeline UI after integration; do not rely only on code review for visual behavior.

## Validation Expectations

For source changes:

- Add or update tests around changed task selection, rendering, or timeline behavior.
- Validate that nested timed local tasks are hidden only as separate timeline blocks, not removed from parent markdown rendering.
- Check that remote calendar events are not affected by local nested-task filtering.
- Check all-day and unscheduled task behavior separately when timeline filtering changes.
- Run at least `npm run test` and `npm run typescript` before claiming source implementation is complete.
- Run `npm run lint` before final completion unless the user explicitly asks for a narrower validation pass.

For documentation or agent-instruction changes:

- Run `git diff --check`.
- Check that committed docs do not contain personal local paths or vault names.
- Keep upstream attribution only in upstream/fork context.
