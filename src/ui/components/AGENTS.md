<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# components

## Purpose

Svelte components that render the planner UI: the timeline and its blocks, the ruler/needle, control buttons and floating controls, the markdown content inside blocks, the time tracker, settings controls, and shared primitives. This is where the visual timeline experience is assembled.

## Key Files

| File                                                                                                                                                                                                                                                                                                     | Description                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `timeline.svelte`                                                                                                                                                                                                                                                                                        | The day timeline surface that lays out positioned blocks.                           |
| `timeline-with-controls.svelte` / `timeline-controls.svelte`                                                                                                                                                                                                                                             | Timeline plus its zoom/navigation controls.                                         |
| `time-block-base.svelte`                                                                                                                                                                                                                                                                                 | Shared block shell: separators, current-state and selection styling.                |
| `positioned-time-block.svelte`                                                                                                                                                                                                                                                                           | Positions a block by time + horizontal overlap placement.                           |
| `local-time-block.svelte` / `unscheduled-time-block.svelte`                                                                                                                                                                                                                                              | Local task block variants.                                                          |
| `remote-time-block-content.svelte`                                                                                                                                                                                                                                                                       | Renders calendar (remote) event content.                                            |
| `rendered-markdown.svelte`                                                                                                                                                                                                                                                                               | Renders nested schedule markdown; styles the timed/untimed dots and connector line. |
| `needle.svelte`                                                                                                                                                                                                                                                                                          | Current-time indicator line.                                                        |
| `ruler.svelte`                                                                                                                                                                                                                                                                                           | Hour ruler on the timeline edge.                                                    |
| `block-list.svelte`, `block-controls.svelte`, `block-control-button.svelte`                                                                                                                                                                                                                              | Block listing + per-block controls.                                                 |
| `drag-controls.svelte`, `resize-controls.svelte`, `resize-handle.svelte`, `resizeable-box.svelte`                                                                                                                                                                                                        | Drag/resize affordances.                                                            |
| `floating-controls.svelte`, `floating-ui.svelte`, `expanding-controls.svelte`                                                                                                                                                                                                                            | Floating/popover control UI.                                                        |
| `mini-timeline.svelte`, `mini-timeline-headless.svelte.ts`                                                                                                                                                                                                                                               | Compact timeline + its headless logic.                                              |
| `settings-controls.svelte`                                                                                                                                                                                                                                                                               | Settings UI; must stay in sync with `src/settings.ts`.                              |
| `time-tracker-with-controls.svelte`, `active-clocks.svelte`, `recent-clocks.svelte`, `time-entry-edit-modal.svelte`                                                                                                                                                                                      | Time-tracking UI.                                                                   |
| `column.svelte`, `scroller.svelte`, `selectable.svelte`, `pill.svelte`, `callout.svelte`, `accordion-button.svelte`, `control-button.svelte`, `properties.svelte`, `day-of-week-picker.svelte`, `show-active-or-all.svelte`, `status-bar-widget.svelte`, `error-boundary.svelte`, `error-message.svelte` | Shared primitives and supporting UI.                                                |
| `defaults.ts`, `lucide.ts`                                                                                                                                                                                                                                                                               | Component defaults and icon set.                                                    |

## Subdirectories

| Directory    | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| `multi-day/` | Weekly/multi-day grid components (see `multi-day/AGENTS.md`) |
| `obsidian/`  | Obsidian-styled UI primitives (see `obsidian/AGENTS.md`)     |

## For AI Agents

### Working In This Directory

- Components consume hooks/stores; avoid direct Obsidian `app`/vault access here.
- `rendered-markdown.svelte` and `time-block-base.svelte` control nested-schedule readability; keep time ranges visible and verify pixel alignment in real Obsidian at multiple display scalings.
- `settings-controls.svelte` changes require matching updates in `src/settings.ts` and tests.

### Testing Requirements

- Rendering logic is covered indirectly via `tests/integration/task-views.test.ts` and hook/util tests; visual changes need manual Obsidian checks.

### Common Patterns

- Svelte components reading context from `src/context/` and hooks from `src/ui/hooks/`; styling via scoped `:global(...)` rules and CSS variables.

## Dependencies

### Internal

- `src/ui/hooks/`, `src/ui/actions/`, `src/context/`, `src/util/`

### External

- `svelte`, `obsidian`, `lucide` icons, `@floating-ui/dom`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
