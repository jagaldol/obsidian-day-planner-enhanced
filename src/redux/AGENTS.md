<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# redux

## Purpose

The Redux Toolkit data layer. Owns the store, slices (global/visible-days, settings, iCal, index), typed slice/selector factories, listener middleware for side effects, and the Svelte-friendly selector/dispatch hooks. Tasks shown on the timeline ultimately flow from selectors defined here.

## Key Files

| File                                           | Description                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `store.ts`                                     | `makeStore`, `createReactor`, and `RootState`/`AppDispatch`/`AppThunk` types.        |
| `create-app-slice.ts`                          | `createAppSlice` - `buildCreateSlice` with async thunk support.                      |
| `create-app-selector.ts`                       | `createAppSelector` - reselect selector typed against `RootState`.                   |
| `global-slice.ts`                              | Visible days state; `visibleDaysUpdated`, `selectSortedDedupedVisibleDays`.          |
| `settings-slice.ts`                            | Settings state; `settingsUpdated`/`settingsLoaded`, `selectSettings`, `selectIcals`. |
| `listener-middleware.ts`                       | `initListenerMiddleware` - registers side-effect listeners (e.g. iCal fetching).     |
| `use-selector.ts` / `use-action-dispatched.ts` | Svelte bindings for reading state and dispatching actions.                           |
| `util.ts`                                      | `createSelectorChangePredicate` for listener trigger conditions.                     |
| `index.ts`                                     | Barrel/entry for the redux module.                                                   |

## Subdirectories

| Directory | Purpose                                                              |
| --------- | -------------------------------------------------------------------- |
| `ical/`   | Remote calendar slice + fetch/parse listeners (see `ical/AGENTS.md`) |
| `index/`  | Vault task index slice + plan/log selectors (see `index/AGENTS.md`)  |

## For AI Agents

### Working In This Directory

- Create slices via `createAppSlice` and selectors via `createAppSelector` so types stay bound to `RootState`.
- Side effects belong in listener middleware, not in reducers.

### Testing Requirements

- `tests/use-selector.test.svelte.ts` and integration suites cover store wiring; iCal/index behavior covered under their subdirectory tests.

### Common Patterns

- Slice + selectors colocated; cross-cutting side effects via listener predicates.

## Dependencies

### Internal

- `src/settings.ts`, `src/task-types.ts`

### External

- `@reduxjs/toolkit`, `reselect`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
