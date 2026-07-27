import { Effect } from "effect";
import type {
  CachedMetadata,
  ListItemCache,
  MetadataCache,
  Vault,
} from "obsidian";
import { expect, test } from "vitest";

import type { ListPropsParser } from "../../src/service/list-props-parser";
import { ListItemEntryEditor } from "../../src/service/list-item-entry-editor";
import { MetadataCacheFacade } from "../../src/service/metadata-cache-facade";
import { VaultFacade } from "../../src/service/vault-facade";
import type { WorkspaceFacade } from "../../src/service/workspace-facade";
import {
  createInMemoryFile,
  FakeMetadataCache,
  FakeWorkspaceFacade,
  InMemoryVault,
} from "../util/fakes";

function createListItem({
  line,
  parent,
}: {
  line: number;
  parent: number;
}): ListItemCache {
  return {
    parent,
    position: {
      start: { line, col: 0, offset: 0 },
      end: { line, col: 0, offset: 0 },
    },
  };
}

test("rewrites nested item indentation to four spaces per level", async () => {
  const path = "test.md";
  const file = createInMemoryFile({
    path,
    contents: [
      "# Heading",
      "- Parent",
      "  - Existing child",
      "    - Existing grandchild",
      "- After",
    ].join("\n"),
  });
  const vault = new InMemoryVault([file]);
  const metadataCache = new FakeMetadataCache({
    [path]: {
      listItems: [
        createListItem({ line: 1, parent: -1 }),
        createListItem({ line: 2, parent: 1 }),
        createListItem({ line: 3, parent: 2 }),
        createListItem({ line: 4, parent: -4 }),
      ],
    } as CachedMetadata,
  }) as unknown as MetadataCache;
  const editor = new ListItemEntryEditor(
    new FakeWorkspaceFacade() as unknown as WorkspaceFacade,
    new VaultFacade(vault as unknown as Vault, () => undefined),
    new MetadataCacheFacade(metadataCache),
    undefined as unknown as ListPropsParser,
  );

  await Effect.runPromise(
    editor.replaceNestedItemsAtLocation({ path, line: 1 }, [
      {
        text: "Existing child",
        symbol: "-",
        children: [{ text: "Existing grandchild", symbol: "-" }],
      },
      { text: "New sibling", symbol: "-" },
    ]),
  );

  expect(file.contents).toBe(
    [
      "# Heading",
      "- Parent",
      "    - Existing child",
      "        - Existing grandchild",
      "    - New sibling",
      "- After",
    ].join("\n"),
  );
});

test("updates the parent text and nested items in one edit", async () => {
  const path = "test.md";
  const file = createInMemoryFile({
    path,
    contents: [
      "# Heading",
      "- [ ] 10:30 - 15:00 Original title",
      "  Parent details",
      "    - Existing child",
      "- After",
    ].join("\n"),
  });
  const vault = new InMemoryVault([file]);
  const metadataCache = new FakeMetadataCache({
    [path]: {
      listItems: [
        createListItem({ line: 1, parent: -1 }),
        createListItem({ line: 3, parent: 1 }),
        createListItem({ line: 4, parent: -4 }),
      ],
    } as CachedMetadata,
  }) as unknown as MetadataCache;
  const editor = new ListItemEntryEditor(
    new FakeWorkspaceFacade() as unknown as WorkspaceFacade,
    new VaultFacade(vault as unknown as Vault, () => undefined),
    new MetadataCacheFacade(metadataCache),
    undefined as unknown as ListPropsParser,
  );

  await Effect.runPromise(
    editor.replaceNestedItemsAtLocation(
      { path, line: 1 },
      [{ text: "Updated child", symbol: "-" }],
      "10:30 - 15:00 Updated [[Project]] title",
    ),
  );

  expect(file.contents).toBe(
    [
      "# Heading",
      "- [ ] 10:30 - 15:00 Updated [[Project]] title",
      "  Parent details",
      "    - Updated child",
      "- After",
    ].join("\n"),
  );
});

test("updates the parent text when it has no nested items", async () => {
  const path = "test.md";
  const file = createInMemoryFile({
    path,
    contents: ["# Heading", "1. 09:00 - 10:00 Original title"].join("\n"),
  });
  const vault = new InMemoryVault([file]);
  const metadataCache = new FakeMetadataCache({
    [path]: {
      listItems: [createListItem({ line: 1, parent: -1 })],
    } as CachedMetadata,
  }) as unknown as MetadataCache;
  const editor = new ListItemEntryEditor(
    new FakeWorkspaceFacade() as unknown as WorkspaceFacade,
    new VaultFacade(vault as unknown as Vault, () => undefined),
    new MetadataCacheFacade(metadataCache),
    undefined as unknown as ListPropsParser,
  );

  await Effect.runPromise(
    editor.replaceNestedItemsAtLocation(
      { path, line: 1 },
      [],
      "09:00 - 10:00 Updated title",
    ),
  );

  expect(file.contents).toBe(
    ["# Heading", "1. 09:00 - 10:00 Updated title"].join("\n"),
  );
});
