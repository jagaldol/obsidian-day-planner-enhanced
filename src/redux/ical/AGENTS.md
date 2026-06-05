<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# ical

## Purpose

Remote calendar integration in the store. Holds fetched iCal text and parsed remote tasks, and runs listener middleware that fetches configured calendars and parses their events into `RemoteTask`s for the visible day range.

## Key Files

| File                     | Description                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ical-slice.ts`          | `icalSlice`, `IcalState`, `RawIcal`, `SerializedRemoteTask`, `isVEvent` guard, `initialIcalState`.                                                     |
| `init-ical-listeners.ts` | `createCachingFetcher`, `createIcalFetchListener`, `createIcalParseListener`, change predicates (`checkVisibleDaysChanged`, `checkIcalEventsChanged`). |

## For AI Agents

### Working In This Directory

- Remote tasks must stay independent from local nested-task filtering; do not let local timeline filters affect calendar events.
- Parsing converts iCal events to tasks via `src/util/ical.ts`; recurrence/range handling lives there.

### Testing Requirements

- Covered by `tests/ical.test.ts`; fixtures under `fixtures/`.

### Common Patterns

- Fetch listener (cached) → parse listener → store; predicates gate when listeners run.

## Dependencies

### Internal

- `src/util/ical.ts` - event→task conversion
- `src/settings.ts` - `IcalConfig`
- `src/task-types.ts` - `RemoteTask`

### External

- `node-ical`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
