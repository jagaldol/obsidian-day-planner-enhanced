<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# overlap

## Purpose

Computes how overlapping timed tasks share horizontal space on the timeline. Determines overlap groups and assigns each task a column span so concurrent blocks render side-by-side without covering each other.

## Key Files

| File                    | Description                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `overlap.ts`            | `computeOverlap` (groups overlapping tasks) and `addHorizontalPlacing` (annotates `WithTime` tasks with placement). |
| `horizontal-placing.ts` | `getHorizontalPlacing(overlap)` → `{ widthPercent, xOffsetPercent }`-style placement; `HorizontalPlacing` type.     |

## For AI Agents

### Working In This Directory

- Pure geometry; no Obsidian or DOM dependency. Keep it deterministic and unit-tested.
- Output feeds `positioned-time-block.svelte` for left/width styling.

### Testing Requirements

- Covered by `tests/overlap.test.ts`; add cases for new overlap arrangements.

### Common Patterns

- Tasks carry `WithTime<BaseTask>`; placement attached as an `Overlap` (see `src/types.ts`).

## Dependencies

### Internal

- `src/types.ts` - `Overlap`
- `src/task-types.ts` - `WithTime`, `BaseTask`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
