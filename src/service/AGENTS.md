<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# service

## Purpose

The Obsidian-facing service layer. Wraps the vault, workspace, metadata cache, and periodic-notes APIs behind facades, and implements the transactional diff writer that turns edited task state into concrete file edits.

## Key Files

| File                        | Description                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `diff-writer.ts`            | Computes a task diff (`getTaskDiffFromEditState`), maps it to range/mdast updates (`mapTaskDiffToUpdates`), and applies them via `createTransaction` / `TransactionWriter`. |
| `list-item-entry-editor.ts` | `ListItemEntryEditor` - edits a specific list item in a note; `runWithNoticeOnError` wrapper.                                                                               |
| `list-props-parser.ts`      | `ListPropsParser` - parses inline props (e.g. clock/log data) from list items.                                                                                              |
| `vault-facade.ts`           | `VaultFacade` - read/modify note contents.                                                                                                                                  |
| `workspace-facade.ts`       | `WorkspaceFacade` - active leaf, editors, file opening.                                                                                                                     |
| `metadata-cache-facade.ts`  | `MetadataCacheFacade` - access Obsidian's metadata cache.                                                                                                                   |
| `periodic-notes.ts`         | `PeriodicNotes` - resolve daily/periodic note files for a date.                                                                                                             |

## For AI Agents

### Working In This Directory

- This is the main place Obsidian APIs are touched; keep UI and pure logic free of direct `app`/vault access by routing through these facades.
- `diff-writer.ts` is the critical write path; nested-task and time-range edits must apply without corrupting surrounding markdown. Add tests under `tests/edit/` and `tests/integration/editing.test.ts`.

### Testing Requirements

- Heavy coverage in `tests/edit/*` and `tests/integration/*`; Obsidian is mocked via `__mocks__/obsidian.ts`.

### Common Patterns

- Facade classes over Obsidian; transactional apply for writes.
- Diff → updates → transaction ordering to keep line ranges valid.

## Dependencies

### Internal

- `src/mdast/` - AST insert/sort for markdown updates
- `src/util/markdown.ts`, `src/util/metadata.ts`
- `src/task-types.ts` - `LocalTask`

### External

- `obsidian`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
