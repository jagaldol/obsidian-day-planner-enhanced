<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# edit

## Purpose
Tests for the task-editing engine (`src/ui/hooks/use-edit/` and `transform/`). Verifies that drag, resize, create, scheduling, all-day handling, nested timed tasks, and multi-container edits produce correct task state and file edits.

## Key Files
| File | Description |
|------|-------------|
| `create.test.ts` | Creating new tasks via the timeline. |
| `drag.test.ts` | Dragging/moving blocks. |
| `resize.test.ts` | Resizing block durations. |
| `nested-timed-tasks.test.ts` | Timed children nested under timed parents. |
| `multiple-containers.test.ts` | Edits spanning multiple notes/containers. |
| `all-day-tasks.test.ts` | All-day/unscheduled task behavior. |
| `common.test.ts` | Shared editing behavior. |
| `edit-blocks.test.ts` | Pure block transform math (`transform/edit-blocks.ts`). |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `util/` | Edit-test fixtures and setup (`fixtures.ts`, `setup.ts`) |

## For AI Agents

### Working In This Directory
- These guard the most fragile behavior (nested tasks, multi-container writes). Update them whenever edit transforms or the diff writer change.
- Assert both the resulting task model and the markdown written back.

### Testing Requirements
- `npx vitest run tests/edit` for the focused pass.

### Common Patterns
- Build an initial state via fixtures, apply an operation, assert resulting tasks/markdown.

## Dependencies

### Internal
- `src/ui/hooks/use-edit/`, `src/service/diff-writer.ts`, `tests/edit/util/`

### External
- `vitest`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
