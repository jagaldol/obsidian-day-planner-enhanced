<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# use-edit

## Purpose

The task-editing engine. Manages an edit operation (drag, resize, create, schedule) from gesture start to commit: tracks the active `EditOperation`, transforms the task set as the pointer moves, exposes edit handlers/actions, and drives cursor feedback. This is the source of truth for interactive timeline edits.

## Key Files

| File                      | Description                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `use-edit-context.ts`     | `useEditContext` - top-level editing context wiring tasks, settings, and handlers.       |
| `create-edit-handlers.ts` | `createEditHandlers` - handlers for starting/applying/confirming edits (`EditHandlers`). |
| `use-edit-actions.ts`     | `useEditActions` - actions exposed to components/menus.                                  |
| `types.ts`                | `EditMode` enum and `EditOperation` interface.                                           |
| `cursor.ts`               | `useCursor` - cursor style based on the active operation.                                |

## Subdirectories

| Directory    | Purpose                                                                        |
| ------------ | ------------------------------------------------------------------------------ |
| `transform/` | Pure functions that apply an edit to the task list (see `transform/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Keep the move/commit split: `transform/` computes new task state purely; committing writes via `src/service/diff-writer.ts`.
- Nested/multi-container edits are sensitive — see `tests/edit/nested-tasks.test.ts` and `multiple-containers.test.ts`.

### Testing Requirements

- Extensive coverage under `tests/edit/` (create, drag, resize, all-day, nested). Add/update tests for any edit-behavior change.

### Common Patterns

- Operation object describes the edit; `transform` maps `tasks + cursorTime → tasks`.

## Dependencies

### Internal

- `src/ui/hooks/use-edit/transform/`, `src/service/diff-writer.ts`
- `src/util/time-block-utils.ts`, `src/global-store/derived-settings.ts`

### External

- `svelte`, `moment`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
