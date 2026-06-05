<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# src

## Purpose

Plugin source code for Day Planner Enhanced. Behavior changes are made here; `npm run build` bundles this into the distributed `main.js`. The architecture splits a Redux data layer (indexing, settings, iCal), a service layer that talks to Obsidian, and a Svelte UI layer that renders the timeline and editing experience.

## Key Files

| File                       | Description                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `main.ts`                  | Plugin entry (`DayPlanner extends Plugin`): registers views, commands, settings, status bar, and wires the Redux store. |
| `settings.ts`              | `DayPlannerSettings` interface, `defaultSettings`, color overrides, iCal config, timeline column types.                 |
| `constants.ts`             | View type ids, context keys, day/date formats, clock tokens.                                                            |
| `task-types.ts`            | Core task model: `Task = LocalTask                                                                                      | RemoteTask`, `WithTime`, `isLocal`/`isRemote` guards. |
| `types.ts`                 | Cross-cutting types: `ObsidianContext`, `OnUpdateFn`, `Signal`, `DateRange`, `RelationToNow`, `Overlap`.                |
| `regexp.ts`                | Shared regexes for time ranges, list tokens, checkboxes, headings, scheduled props.                                     |
| `tasks-plugin.ts`          | Integration shim for the obsidian-tasks plugin API (`createGetTasksApi`).                                               |
| `create-update-handler.ts` | Builds handlers that write edits back to notes (line edit / update).                                                    |
| `dump-metadata.ts`         | Dev command to dump Obsidian metadata cache (used to refresh test fixtures).                                            |
| `styles.scss`              | Source styles compiled to `styles.css`.                                                                                 |

## Subdirectories

| Directory       | Purpose                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| `context/`      | Svelte context getters for Obsidian + date range (see `context/AGENTS.md`)         |
| `feature/`      | Feature adapters bridging Obsidian to the store (see `feature/AGENTS.md`)          |
| `global-store/` | Svelte stores/signals for settings and current time (see `global-store/AGENTS.md`) |
| `mdast/`        | Markdown AST helpers for reading/writing list structure (see `mdast/AGENTS.md`)    |
| `overlap/`      | Timeline overlap + horizontal placement math (see `overlap/AGENTS.md`)             |
| `parser/`       | Time-range parsing from text lines (see `parser/AGENTS.md`)                        |
| `redux/`        | Redux Toolkit store: indexing, settings, iCal slices (see `redux/AGENTS.md`)       |
| `service/`      | Obsidian-facing services: vault, workspace, diff writing (see `service/AGENTS.md`) |
| `ui/`           | Views, Svelte components, hooks, actions (see `ui/AGENTS.md`)                      |
| `util/`         | Pure utilities: time, markdown, tasks, iCal, DOM (see `util/AGENTS.md`)            |

## For AI Agents

### Working In This Directory

- Never hand-edit generated `main.js`/`styles.css` as the implementation path; change source here and rebuild.
- Settings changes must be made in lockstep across `settings.ts`, `ui/components/settings-controls.svelte`, and dependent tests/docs.
- Respect the product direction in the root `AGENTS.md`: nested timed children render inside their parent block, not as separate overlapping blocks; time ranges must stay visible.

### Testing Requirements

- `npm run test` (Vitest) and `npm run typescript` before claiming completion; `npm run lint` for the full pass.

### Common Patterns

- Strict TypeScript with `noUncheckedIndexedAccess`.
- Redux Toolkit slices created via `redux/create-app-slice.ts`; selectors via `redux/create-app-selector.ts`.
- Tasks flow: indexed notes → `redux/index` slice → selectors → UI hooks → Svelte components.

## Dependencies

### External

- `obsidian` - host API (mocked in tests via `__mocks__/obsidian.ts`)
- `@reduxjs/toolkit` - state management
- `svelte` - UI components
- `node-ical`, `mdast`/`remark`, `moment`/`luxon` - calendar, markdown, time

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
