<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-08-02 -->

# index

## Purpose

The vault task index in the store. Holds normalized list-item entries parsed from notes and exposes selectors that turn them into plan and log time blocks for requested days. Populated by `src/feature/vault-index-adapter.ts`.

## Key Files

| File                     | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| `index-slice.ts`         | `indexSlice` and normalized entry types/lookups for list items, plans, and logs. |
| `entry-to-time-block.ts` | Converts indexed plan/log entries into local time-block models.                  |
| `index-selectors.ts`     | Selectors for plan, active-log, recent-log, and per-day log time blocks.         |

## For AI Agents

### Working In This Directory

- `planEntryToTimeBlock` and the plan selectors define which blocks reach the timeline and how nesting/children are represented; coordinate changes with `src/util/time-block-utils.ts` and timeline hooks.
- Preserve nested-child relationships so timed children render inside their parent block.

### Testing Requirements

- Covered by `tests/integration/indexing.test.ts` and `task-views.test.ts`.

### Common Patterns

- Entry tree (parent → children) selected and mapped to `LocalTimeBlock` for UI.

## Dependencies

### Internal

- `src/util/metadata.ts`, `src/util/time-block-utils.ts`
- `src/time-block-types.ts` - `LocalTimeBlock`

### External

- `@reduxjs/toolkit`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
