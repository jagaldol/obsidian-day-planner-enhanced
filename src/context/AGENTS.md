<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# context

## Purpose

Typed Svelte context accessors. Components call these getters to retrieve the shared `ObsidianContext` and the active date range without prop-drilling. Keys are defined in `src/constants.ts` (`obsidianContextKey`, `dateRangeContextKey`).

## Key Files

| File                    | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `obsidian-context.ts`   | `getObsidianContext()` - reads the `ObsidianContext` from Svelte context.   |
| `date-range-context.ts` | `getDateRangeContext()` - reads the current `DateRange` store from context. |

## For AI Agents

### Working In This Directory

- These are thin `getContext` wrappers; the context values are set higher up (views in `src/ui/*-view.ts`).
- If you add a context key, define it in `src/constants.ts` and the value type in `src/types.ts`.

### Testing Requirements

- Exercised indirectly through component/integration tests under `tests/`.

### Common Patterns

- One getter per context key, strongly typed against `src/types.ts`.

## Dependencies

### Internal

- `src/constants.ts` - context keys
- `src/types.ts` - `ObsidianContext`, `DateRange`

### External

- `svelte` - `getContext`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
