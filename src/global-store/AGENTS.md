<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# global-store

## Purpose

Svelte stores and signals for globally shared, reactive state that sits outside Redux: the current wall-clock time, the active settings snapshot, and derived geometry helpers that map times to timeline pixel offsets.

## Key Files

| File                  | Description                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `current-time.ts`     | `currentTime` readable (ticks `window.moment()`), `currentTimeSignal`, and `isToday` derived store. |
| `settings.ts`         | `settings` writable + `settingsSignal`; the live settings mirror used by UI.                        |
| `derived-settings.ts` | Pure geometry from settings: `getHourSize`, `getVisibleHours`, `timeToTimelineOffset`, `snap`.      |

## For AI Agents

### Working In This Directory

- `derived-settings.ts` functions are pure and drive timeline layout; changing them shifts block positioning. Add tests when touching offset/snap math.
- `settings.ts` here is the reactive mirror; the canonical settings type/defaults live in `src/settings.ts` and the Redux `settings-slice.ts`.

### Testing Requirements

- Geometry helpers are unit-testable; current-time behavior surfaces in timeline/needle tests.

### Common Patterns

- Svelte stores bridged to signals via `fromStore` for use in `.svelte.ts` hooks.

## Dependencies

### Internal

- `src/settings.ts` - `DayPlannerSettings`, defaults

### External

- `svelte/store`, `moment`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
