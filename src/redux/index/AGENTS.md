<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# index

## Purpose

The vault task index in the store. Holds normalized list-item entries parsed from notes and exposes selectors that turn them into plan entries (timeline tasks) and log entries (clocked time) for given days. Populated by `src/feature/vault-index-adapter.ts`.

## Key Files

| File                 | Description                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `index-slice.ts`     | `indexSlice`, entry types (`ListItemEntry`, `LogEntry`, `PlanEntry`, `ListItemEntryWithChildren`), and `planEntryToLocalTask`. |
| `index-selectors.ts` | `selectPlanEntriesForDays`/`selectPlanEntriesForVisibleDays`, `selectLogEntriesForDay`, `selectRecentLogEntries`.              |

## For AI Agents

### Working In This Directory

- `planEntryToLocalTask` and the plan selectors define which tasks reach the timeline and how nesting/children are represented; coordinate changes with `src/util/task-utils.ts` and timeline hooks.
- Preserve nested-child relationships so timed children render inside their parent block.

### Testing Requirements

- Covered by `tests/integration/indexing.test.ts` and `task-views.test.ts`.

### Common Patterns

- Entry tree (parent → children) selected and mapped to `LocalTask` for UI.

## Dependencies

### Internal

- `src/util/metadata.ts`, `src/util/task-utils.ts`
- `src/task-types.ts` - `LocalTask`

### External

- `@reduxjs/toolkit`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
