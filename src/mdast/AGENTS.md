<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-05 | Updated: 2026-06-05 -->

# mdast

## Purpose

Markdown AST (mdast) utilities for reading and rewriting note structure: finding headings with their child lists, sorting list items by embedded timestamps, inserting list items under a heading, and serializing back to markdown. Used by the diff/edit writers to apply task changes to notes.

## Key Files

| File       | Description                                                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mdast.ts` | AST helpers: `toMarkdown`, `sortListsRecursively`/`sortListsRecursivelyInMarkdown`, `findHeadingWithChildren`, `findFirst`, `updateFirst`, `insertListItemUnderHeading`, `compareByTimestampInText`, node type guards (`isParentNode`, `isTextNode`, `isHeading`). |

## For AI Agents

### Working In This Directory

- These helpers must round-trip markdown faithfully; preserve list tokens, checkboxes, and block ids.
- Time-ordered sorting relies on `compareByTimestampInText` reading `HH:mm` ranges from node text.

### Testing Requirements

- Covered by `tests/mdast.test.ts`; add cases when changing sort or insertion behavior.

### Common Patterns

- Operate on remark/mdast `Node`/`Parent` trees; convert with `toMarkdown`.

## Dependencies

### Internal

- `src/regexp.ts` - timestamp/list patterns

### External

- `mdast`, `mdast-util-*` / `remark` ecosystem, `unist-util-*`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
