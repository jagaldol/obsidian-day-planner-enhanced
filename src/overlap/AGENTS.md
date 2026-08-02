<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-08-02 -->

# overlap

## Purpose

Computes how overlapping time blocks share horizontal space on the timeline. Determines overlap groups and assigns each block a column span so concurrent blocks render side-by-side without covering each other.

## Key Files

| File                    | Description                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `overlap.ts`            | `computeOverlap` groups `TimeInterval`s and `addHorizontalPlacing` annotates blocks with placement.             |
| `horizontal-placing.ts` | `getHorizontalPlacing(overlap)` → `{ widthPercent, xOffsetPercent }`-style placement; `HorizontalPlacing` type. |

## For AI Agents

### Working In This Directory

- Pure geometry; no Obsidian or DOM dependency. Keep it deterministic and unit-tested.
- Output feeds `positioned-time-block.svelte` for left/width styling.

### Testing Requirements

- Covered by `tests/overlap.test.ts`; add cases for new overlap arrangements.

### Common Patterns

- Inputs satisfy `TimeInterval`; outputs carry `WithPlacing<T>` and use `Overlap` geometry.

## Dependencies

### Internal

- `src/types.ts` - `Overlap`
- `src/time-block-types.ts` - `TimeInterval`, `WithPlacing`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
