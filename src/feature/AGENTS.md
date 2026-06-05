<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# feature

## Purpose

Adapters that connect Obsidian's runtime to the Redux index. Currently hosts the vault indexing adapter that keeps the store's task index in sync with the vault metadata cache.

## Key Files

| File                     | Description                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `vault-index-adapter.ts` | `VaultIndexAdapter` - subscribes to vault/metadata changes and feeds list-item entries into the index slice. |

## For AI Agents

### Working In This Directory

- This is the bridge between Obsidian events and `src/redux/index/`. Changes here affect what tasks appear on the timeline.
- Keep Obsidian API access behind the service facades in `src/service/` where possible.

### Testing Requirements

- Covered by `tests/integration/indexing.test.ts` and related integration suites.

### Common Patterns

- Event subscription → normalize → dispatch index updates.

## Dependencies

### Internal

- `src/redux/index/` - index slice it populates
- `src/service/metadata-cache-facade.ts`, `src/service/vault-facade.ts`

### External

- `obsidian`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
