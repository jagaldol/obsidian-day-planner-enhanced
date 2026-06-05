<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# transform

## Purpose

Pure transformation functions that compute the next task list for an in-progress edit. Given the current tasks, the active operation, and a cursor time, they return updated tasks without touching Obsidian or the DOM — making edit behavior deterministic and unit-testable.

## Key Files

| File             | Description                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `transform.ts`   | `transform` - dispatches an `EditOperation` to the right block edit and returns updated tasks. |
| `edit-blocks.ts` | `editBlocks` - applies drag/resize/create math to affected blocks.                             |

## For AI Agents

### Working In This Directory

- Keep these functions pure and side-effect-free; all I/O happens in the caller (`use-edit`) and `diff-writer`.
- Preserve invariants: time ranges remain valid, nested children stay attached to parents, no negative durations.

### Testing Requirements

- Core target of `tests/edit/edit-blocks.test.ts` and the broader `tests/edit/` suite.

### Common Patterns

- `(tasks, operation, cursorTime) => tasks`; immutable updates.

## Dependencies

### Internal

- `src/ui/hooks/use-edit/types.ts`, `src/util/task-utils.ts`, `src/global-store/derived-settings.ts`

### External

- `moment`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
