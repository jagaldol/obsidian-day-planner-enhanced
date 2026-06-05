<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# util

## Purpose

Pure, mostly Obsidian-agnostic utilities shared across the plugin: task computations, markdown text manipulation, time/moment helpers, iCal conversion, DOM helpers, color/contrast, and small functional helpers. This is the home for logic that should be unit-testable in isolation.

## Key Files

| File                                                                                                                                                                                                                                         | Description                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task-utils.ts`                                                                                                                                                                                                                              | Task math + rendering: `getEndMinutes`/`getEndTime`, `isWithTime`, `getRenderKey`, `getNotificationKey`, `copy`, and nested schedule rendering (`toRenderableMarkdown`, divider/time-range logic). |
| `markdown.ts`                                                                                                                                                                                                                                | Text helpers: `toggleCheckbox`, `createHeading`, `updateLine`, `indent`/`indentLines`, `getFirstLine`.                                                                                             |
| `moment.ts`                                                                                                                                                                                                                                  | Time math: `getMinutesSinceMidnight`, `toMinutes`, `getDiffInMinutes`, `minutesToMoment*`.                                                                                                         |
| `ical.ts`                                                                                                                                                                                                                                    | Convert iCal events to tasks for a date range (`icalEventToTasksForRange`, `icalEventToTask`, `canHappenAfter`).                                                                                   |
| `range.ts`                                                                                                                                                                                                                                   | Day-range builders: `createRange`, `getFullWeek`, `getWorkWeek`, `getUpcomingDays`.                                                                                                                |
| `dom.ts`                                                                                                                                                                                                                                     | Pointer/DOM helpers: `offsetYToMinutes`, `isEventOutside`, `mountSanitized`, touch detection.                                                                                                      |
| `color.ts`                                                                                                                                                                                                                                   | `getTextColorWithEnoughContrast`, contrast types.                                                                                                                                                  |
| `props.ts`                                                                                                                                                                                                                                   | Zod schemas for inline props/log entries; open-clock helpers.                                                                                                                                      |
| `metadata.ts`                                                                                                                                                                                                                                | Obsidian metadata helpers: `isTaskCache`, `isInside`, `createLineToChildrenLookup`.                                                                                                                |
| `scheduler.ts`                                                                                                                                                                                                                               | `createBackgroundBatchScheduler` for chunked background work.                                                                                                                                      |
| `create-render-markdown.ts` / `create-show-preview.ts`                                                                                                                                                                                       | Factories for Obsidian markdown rendering + hover preview.                                                                                                                                         |
| `clock.ts`, `editor.ts`, `error.ts`, `ellipsis.ts`, `id.ts`, `lift.ts`, `to-spliced.ts`, `store.ts`, `performance.ts`, `notify-about-started-tasks.ts`, `handle-active-leaf-change.ts`, `create-environment-hooks.ts`, `create-error-url.ts` | Focused single-purpose helpers (clocks, editor positions, error formatting, ids, array ops, notifications, etc.).                                                                                  |

## For AI Agents

### Working In This Directory

- Keep functions pure and side-effect-free where possible; prefer adding logic here over embedding it in components.
- `task-utils.ts` rendering (`toRenderableMarkdown`) feeds `ui/components/rendered-markdown.svelte`; preserve time ranges and divider behavior and update `tests/integration/task-views.test.ts`.

### Testing Requirements

- Directly unit-tested under `tests/util/` and exercised by integration tests; add/adjust tests with any behavior change.

### Common Patterns

- Small composable functions; `flow`/`lodash` style composition appears in task rendering.

## Dependencies

### Internal

- `src/task-types.ts`, `src/types.ts`, `src/regexp.ts`, `src/parser/`

### External

- `moment`/`luxon`, `node-ical`, `zod`, `obsidian` (only where unavoidable)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
