<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# integration

## Purpose
Higher-level integration tests that exercise the full pipeline from indexed vault metadata through the store to rendered task views and edits. Uses a metadata dump and fixture vault to reproduce realistic Obsidian state.

## Key Files
| File | Description |
|------|-------------|
| `indexing.test.ts` | Vault metadata → index slice → plan entries. |
| `task-views.test.ts` | `toRenderableMarkdown` / nested schedule rendering (dividers, time ranges). |
| `editing.test.ts` | End-to-end edit-and-write flows. |
| `clocking.test.ts` | Clock-in/out and log entries. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `util/` | `metadata-dump.ts` loader and `setup.ts` for integration state |
| `__snapshots__/` | Vitest snapshots for rendered output |

## For AI Agents

### Working In This Directory
- `task-views.test.ts` is the contract for nested-schedule rendering; update it when changing `src/util/time-block-utils.ts` divider/time-range behavior.
- Regenerate the metadata dump via the dev dump command rather than editing it by hand.

### Testing Requirements
- `npx vitest run tests/integration` for the focused pass.

### Common Patterns
- Load fixture state → run selectors/render → assert markdown/snapshots.

## Dependencies

### Internal
- `src/redux/index/`, `src/util/time-block-utils.ts`, `fixtures/`, `tests/integration/util/`

### External
- `vitest`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
