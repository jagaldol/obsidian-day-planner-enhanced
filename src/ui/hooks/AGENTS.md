<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-08-02 -->

# hooks

## Purpose

Reactive hooks that compose store selectors and global stores into view-ready data: the visible task set, color/contrast styling tied to the current time, date ranges, online status, modifier keys, status-bar widget, and the task-editing context.

## Key Files

| File                                                        | Description                                                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `use-time-blocks.ts`                                        | `useTimeBlocks` - the displayed time-block set for the current view.                                              |
| `use-time-block-visuals.ts`                                 | `useTimeBlockVisuals` - derive layout props for a time block.                                                     |
| `use-color.svelte.ts`                                       | `useStylesForRelationToNow`, `useColoredTimeline`, `useColorOverrides` - past/present/future + override coloring. |
| `use-newly-started-time-blocks.ts`                          | Detect plan time blocks crossing into "now".                                                                      |
| `use-status-bar-widget.ts`                                  | `useStatusBarWidget`, `mountStatusBarWidget`, `minutesToTimestamp`.                                               |
| `use-floating-ui.ts`                                        | `useFloatingUi` - popover positioning.                                                                            |
| `use-is-online.ts`, `use-key-down.ts`, `use-mod-pressed.ts` | Environment/input hooks.                                                                                          |

## Subdirectories

| Directory   | Purpose                                                            |
| ----------- | ------------------------------------------------------------------ |
| `use-edit/` | Task editing state machine and handlers (see `use-edit/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Hooks should read from selectors (`src/redux/`) and stores (`src/global-store/`), not Obsidian APIs directly.
- Green = current/future accent, blue = selected: keep `use-color.svelte.ts` aligned with that visual language.

### Testing Requirements

- `tests/use-time-block-visuals.test.ts` and integration suites; add tests when changing time-block selection or coloring.

### Common Patterns

- Svelte 5 runes in `.svelte.ts` files; signals derived from stores.

## Dependencies

### Internal

- `src/redux/`, `src/global-store/`, `src/util/`

### External

- `svelte`, `@floating-ui/dom`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
