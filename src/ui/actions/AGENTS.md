<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# actions

## Purpose

Svelte `use:` actions and small action helpers attached to DOM elements: pointer gestures for drag/resize, hover previews, outside-pointer detection, prop memoization, and HTML mounting. These bridge raw DOM events to the edit/interaction logic.

## Key Files

| File                            | Description                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `gestures.ts`                   | `createGestures` - pointer down/move/up gesture handling for blocks.                          |
| `create-resize-state.ts`        | `createResizeState` - state machine for block resizing.                                       |
| `hover-preview.ts`              | `hoverPreview` - Obsidian hover-link preview for a task location.                             |
| `pointer-up-outside.ts`         | `pointerUpOutside` / `createPointerUpOutsideAction` - detect interactions outside an element. |
| `memoize-props.ts`              | `createMemo` - memoize component props to avoid redundant work.                               |
| `mount-html.svelte.ts`          | `mountHtmlAction` - mount sanitized HTML into an element.                                     |
| `post-process-task-markdown.ts` | `disableCheckBoxes` - post-process rendered task markdown.                                    |
| `use-actions.ts`                | Types/helpers for composing multiple Svelte actions.                                          |

## For AI Agents

### Working In This Directory

- Actions run in the DOM; use the helpers in `src/util/dom.ts` for pointer math and event-boundary checks.
- Gesture/resize actions feed the editing pipeline in `src/ui/hooks/use-edit/`.

### Testing Requirements

- Behavior surfaces through `tests/edit/drag.test.ts`, `resize.test.ts`, and related suites.

### Common Patterns

- Svelte action signature `(node, params) => { update?, destroy? }`.

## Dependencies

### Internal

- `src/util/dom.ts`, `src/ui/hooks/use-edit/`

### External

- `svelte/action`, `obsidian`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
