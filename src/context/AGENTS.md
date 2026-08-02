<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-08-02 -->

# context

## Purpose

Typed Svelte context accessors. Components call these getters to retrieve the shared `ObsidianContext`, active date range, and sidebar placement without prop-drilling. Keys are defined in `src/constants.ts`.

## Key Files

| File                       | Description                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| `obsidian-context.ts`      | `getObsidianContext()` - reads the `ObsidianContext` from Svelte context.   |
| `date-range-context.ts`    | `getDateRangeContext()` - reads the current `DateRange` store from context. |
| `is-in-sidebar-context.ts` | `getIsInSidebarContext()` - reads whether the view is in a sidebar leaf.    |

## For AI Agents

### Working In This Directory

- These are thin `getContext` wrappers; the context values are set higher up (views in `src/ui/*-view.ts`).
- If you add a context key, define it in `src/constants.ts` and keep its value type beside the owning API.

### Testing Requirements

- Exercised indirectly through component/integration tests under `tests/`.

### Common Patterns

- One getter per context key, strongly typed against its owning module.

## Dependencies

### Internal

- `src/constants.ts` - context keys
- `src/types.ts` - `ObsidianContext`
- `src/redux/date-ranges.ts` - `DateRange`

### External

- `svelte` - `getContext`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
