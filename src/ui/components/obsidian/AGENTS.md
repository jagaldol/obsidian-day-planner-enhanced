<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# obsidian

## Purpose

Low-level UI primitives styled to match Obsidian's native look: dropdowns, setting items, and a collapsible tree. These keep the plugin's controls visually consistent with the host app.

## Key Files

| File                                 | Description                                      |
| ------------------------------------ | ------------------------------------------------ |
| `dropdown.svelte`                    | Obsidian-styled dropdown/select.                 |
| `setting-item.svelte`                | Setting row matching Obsidian's settings layout. |
| `tree.svelte` / `tree-button.svelte` | Collapsible tree and its toggle button.          |
| `right-triangle.svelte`              | Disclosure triangle icon used by the tree.       |

## For AI Agents

### Working In This Directory

- Mirror Obsidian's native classes/markup so theming stays consistent; avoid custom styling that diverges from the host.
- Used by `settings-controls.svelte` and other control UIs in the parent directory.

### Testing Requirements

- Visual; verify against Obsidian's native components.

### Common Patterns

- Thin presentational components with minimal logic.

## Dependencies

### Internal

- Consumed by `src/ui/components/` controls

### External

- `svelte`, `obsidian` styling conventions

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
