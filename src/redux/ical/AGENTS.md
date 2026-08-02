<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-08-02 -->

# ical

## Purpose

Remote calendar integration in the store. Holds fetched iCal text and parsed remote time blocks, and runs listener middleware that fetches configured calendars and parses their events into `RemoteTimeBlock`s for tracked date ranges.

## Key Files

| File                     | Description                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `ical-slice.ts`          | `icalSlice`, `IcalState`, `RawIcal`, serialized remote-block state, and `isVEvent`. |
| `init-ical-listeners.ts` | Fetch/parse listeners plus predicates for iCal and tracked date-range changes.      |

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
- `src/time-block-types.ts` - `RemoteTimeBlock`

### External

- `node-ical`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
