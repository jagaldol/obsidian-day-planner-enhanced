<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# tests

## Purpose
Vitest test suites for the plugin. Covers pure utilities, parsing, overlap, mdast, iCal, Redux selectors, and higher-level editing/indexing/rendering behavior. Obsidian is mocked via `__mocks__/obsidian.ts`; fixtures live under the repo-level `fixtures/`.

## Key Files
| File | Description |
|------|-------------|
| `mdast.test.ts` | Markdown AST sort/insert/round-trip. |
| `overlap.test.ts` | Overlap grouping and horizontal placement. |
| `time.test.ts` | Time/time-range parsing. |
| `ical.test.ts` | iCal event → task conversion. |
| `use-selector.test.svelte.ts` | Redux selector/Svelte binding. |
| `use-task-visuals.test.ts` | Task visual derivation. |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `edit/` | Editing transforms: create, drag, resize, nested, all-day (see `edit/AGENTS.md`) |
| `integration/` | End-to-end indexing, editing, clocking, task views (see `integration/AGENTS.md`) |
| `util/` | Test helpers (`diff.ts`, `fakes.ts`) |
| `__snapshots__/` | Vitest snapshots |

## For AI Agents

### Working In This Directory
- Add or update tests alongside any source change to task selection, rendering, editing, or timeline behavior.
- Prefer targeted suites first (`npx vitest run <file>`), then broaden to `npm run test` / `npm run lint`.
- Refresh fixtures via the metadata dump command rather than hand-editing dumps.

### Testing Requirements
- `npm run test` runs Vitest; setup in `vite-setup.ts` and `tests/**/util/setup.ts`.

### Common Patterns
- Mocked Obsidian; fake builders in `tests/util/fakes.ts`; snapshot + explicit assertions.

## Dependencies

### Internal
- `__mocks__/obsidian.ts`, `fixtures/`, `src/**`

### External
- `vitest`, `@testing-library`-style helpers where applicable

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
