<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# parser

## Purpose

Parses `HH:mm` times and `HH:mm - HH:mm` ranges out of raw task lines and produces moment-based start/end times for a given day. Also provides replacement/comparison helpers for time ranges in text.

## Key Files

| File        | Description                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------- |
| `parser.ts` | `getTimeFromLine` (extract start/end for a day), `replaceOrPrependTimeRange`, `compareTimestamps`. |
| `time.ts`   | `parseTime(asText, day)` - parse a single time string into a `Moment` on `day`.                    |

## For AI Agents

### Working In This Directory

- Time parsing must align with `src/regexp.ts` patterns and the time-range display contract (ranges must never be dropped).
- Day context matters: times are resolved relative to a passed-in `Moment` day.

### Testing Requirements

- Covered by `tests/time.test.ts`; add cases for edge times and malformed input.

### Common Patterns

- Pure functions returning `Moment`s; no side effects.

## Dependencies

### Internal

- `src/regexp.ts` - time/time-range regexes

### External

- `moment`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
