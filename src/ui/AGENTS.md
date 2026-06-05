<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# ui

## Purpose

The presentation layer: Obsidian `ItemView` registrations, context menus, modals, the settings tab, and the Svelte component/hook/action tree that renders the timeline, multi-day grid, and time tracker. This directory turns store state into the interactive planner UI.

## Key Files

| File                                                                                | Description                                                                  |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `timeline-view.ts`                                                                  | `TimelineView extends ItemView` - the main day timeline view.                |
| `multi-day-view.ts`                                                                 | `MultiDayView extends ItemView` - weekly/multi-day grid view.                |
| `time-tracker-view.ts`                                                              | `TimeTrackerView extends ItemView` - clock/time-tracking view.               |
| `release-notes.ts`                                                                  | `DayPlannerReleaseNotesView` - in-app release notes.                         |
| `settings-tab.ts`                                                                   | `DayPlannerSettingsTab extends PluginSettingTab`.                            |
| `*-menu.ts`                                                                         | Context menu builders (time block, column change/selection, clocks, editor). |
| `create-edit-time-entry-modal.ts`, `confirmation-modal.ts`, `SingleSuggestModal.ts` | Modal/dialog creators.                                                       |
| `undo-notice.ts`                                                                    | Undo toast after edits.                                                      |
| `floating-ui-util.ts`                                                               | Floating UI offset helper for popovers.                                      |

## Subdirectories

| Directory     | Purpose                                                                                |
| ------------- | -------------------------------------------------------------------------------------- |
| `actions/`    | Svelte `use:` actions: gestures, resize, hover preview, memo (see `actions/AGENTS.md`) |
| `components/` | Svelte components for the timeline and controls (see `components/AGENTS.md`)           |
| `hooks/`      | Reactive hooks: tasks, colors, date ranges, editing (see `hooks/AGENTS.md`)            |

## For AI Agents

### Working In This Directory

- Views set Svelte context (`ObsidianContext`, `DateRange`); components read it via `src/context/`.
- Keep Obsidian API access in views/menus/services; components should consume hooks and stores, not `app` directly.
- Visual behavior must be verified in real Obsidian, not only by code review (see root `AGENTS.md`).

### Testing Requirements

- Logic is covered through hooks/util tests and integration suites; visual changes need manual Obsidian verification.

### Common Patterns

- View → mount Svelte component with context → component uses hooks/selectors.

## Dependencies

### Internal

- `src/redux/`, `src/global-store/`, `src/context/`, `src/service/`

### External

- `obsidian`, `svelte`, `@floating-ui/dom`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
