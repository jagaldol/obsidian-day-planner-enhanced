<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# multi-day

## Purpose

Components for the multi-day / weekly grid view: the overall grid, per-day rows, and the overlay that draws column tracks for overlapping blocks across days.

## Key Files

| File                           | Description                              |
| ------------------------------ | ---------------------------------------- |
| `multi-day-grid.svelte`        | The week/multi-day grid container.       |
| `multi-day-row.svelte`         | A single day's row within the grid.      |
| `column-tracks-overlay.svelte` | Overlay rendering overlap column tracks. |

## For AI Agents

### Working In This Directory

- Reuses timeline block/positioning logic from the parent `components/` directory; keep block rendering consistent with the single-day timeline.
- Mounted by `src/ui/multi-day-view.ts`.

### Testing Requirements

- Visual; verify in Obsidian's multi-day view. Underlying task selection covered by integration tests.

### Common Patterns

- Grid → rows → positioned blocks, sharing overlap placement from `src/overlap/`.

## Dependencies

### Internal

- `src/ui/components/` (block + positioning), `src/overlap/`, `src/ui/hooks/`

### External

- `svelte`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
