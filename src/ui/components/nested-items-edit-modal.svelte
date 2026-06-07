<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import {
    Check,
    ChevronDown,
    ChevronUp,
    ListPlus,
    Pencil,
    Plus,
    Square,
    SquareCheck,
    Trash2,
    X,
  } from "lucide-svelte";
  import { onDestroy, untrack } from "svelte";
  import { isNotVoid } from "typed-assert";

  import { timeRangeAtStartOfLineRegExp } from "../../regexp";
  import type { EditableNestedListItem } from "../../service/list-item-entry-editor";

  let {
    initialItems,
    parentText,
    onSave,
    onCancel,
  }: {
    initialItems: EditableNestedListItem[];
    parentText: string;
    onSave: (items: EditableNestedListItem[]) => Promise<void> | void;
    onCancel: () => void;
  } = $props();

  function cloneItems(
    items: EditableNestedListItem[],
  ): EditableNestedListItem[] {
    return items.map((item) => ({
      text: item.text,
      symbol: item.symbol,
      status: item.status,
      task: item.task,
      children: cloneItems(item.children ?? []),
    }));
  }

  function createNewItem(): EditableNestedListItem {
    return { text: "New item", symbol: "-" };
  }

  function getFirstLine(text: string) {
    return text.split("\n")[0] ?? "";
  }

  function getDisplayParts(text: string) {
    const firstLine = getFirstLine(text).trim();
    const match = firstLine.match(timeRangeAtStartOfLineRegExp);

    if (!match) {
      return { title: firstLine, timeRange: undefined };
    }

    const timeRange = match[0].trim();
    const title = firstLine.slice(match[0].length).trim();

    return {
      timeRange,
      title: title.length === 0 ? firstLine : title,
    };
  }

  function focusOnMount(node: HTMLInputElement) {
    window.requestAnimationFrame(() => node.focus());
  }

  function replaceFirstLine(text: string, firstLine: string) {
    const [, ...rest] = text.split("\n");

    return [firstLine, ...rest].join("\n");
  }

  function getSiblings(path: number[]) {
    let siblings = items;

    for (const index of path.slice(0, -1)) {
      const item = siblings[index];

      isNotVoid(item);

      item.children ??= [];
      siblings = item.children;
    }

    return siblings;
  }

  function getItem(path: number[]) {
    const siblings = getSiblings(path);
    const index = path[path.length - 1];

    isNotVoid(index);

    const item = siblings[index];

    isNotVoid(item);

    return item;
  }

  function addRootItem() {
    applyOpenEdit();
    clearMoveFeedback();

    const newItem = createNewItem();
    const nextIndex = items.length;

    items = [...items, newItem];
    beginEdit(`${nextIndex}`, newItem);
  }

  function addChild(path: number[]) {
    applyOpenEdit();
    clearMoveFeedback();

    const item = getItem(path);
    const newItem = createNewItem();
    const nextIndex = item.children?.length ?? 0;

    item.children = [...(item.children ?? []), newItem];
    beginEdit([...path, nextIndex].join("."), newItem);
  }

  function deleteItem(path: number[]) {
    applyOpenEdit();
    clearMoveFeedback();

    const siblings = getSiblings(path);
    const index = path[path.length - 1];

    isNotVoid(index);

    siblings.splice(index, 1);
  }

  function moveItem(path: number[], direction: -1 | 1) {
    applyOpenEdit();

    const siblings = getSiblings(path);
    const index = path[path.length - 1];

    isNotVoid(index);

    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= siblings.length) {
      return;
    }

    const [item] = siblings.splice(index, 1);

    isNotVoid(item);

    siblings.splice(nextIndex, 0, item);

    const nextPath = [...path];

    nextPath[nextPath.length - 1] = nextIndex;
    showMoveFeedback(nextPath.join("."), direction);
  }

  function isTask(item: EditableNestedListItem) {
    return item.status !== undefined || item.task !== undefined;
  }

  function getTaskState(item: EditableNestedListItem) {
    return item.status ?? item.task ?? " ";
  }

  function isTaskComplete(item: EditableNestedListItem) {
    return getTaskState(item).toLowerCase() === "x";
  }

  function getTaskToggleLabel(item: EditableNestedListItem) {
    return isTask(item) ? "Convert to bullet" : "Convert to task";
  }

  function getTaskCompletionToggleLabel(item: EditableNestedListItem) {
    return isTaskComplete(item) ? "Mark incomplete" : "Mark complete";
  }

  function toggleTask(path: number[]) {
    applyOpenEdit();
    clearMoveFeedback();

    const item = getItem(path);

    if (isTask(item)) {
      delete item.status;
      delete item.task;
      return;
    }

    item.task = " ";
  }

  function toggleTaskCompletion(path: number[]) {
    clearMoveFeedback();

    const item = getItem(path);

    if (!isTask(item)) {
      return;
    }

    const nextState = isTaskComplete(item) ? " " : "x";

    if (item.status !== undefined) {
      item.status = nextState;
      return;
    }

    item.task = nextState;
  }

  function beginEdit(pathKey: string, item: EditableNestedListItem) {
    editingPathKey = pathKey;
    editingText = getFirstLine(item.text);
  }

  function applyEdit(pathKey: string) {
    if (editingPathKey !== pathKey) {
      return;
    }

    if (editingText.trim().length === 0) {
      cancelEdit();
      return;
    }

    const path = pathKey.split(".").map(Number);
    const item = getItem(path);

    item.text = replaceFirstLine(item.text, editingText.trim());
    cancelEdit();
  }

  function cancelEdit() {
    editingPathKey = undefined;
    editingText = "";
  }

  function clearMoveFeedback() {
    if (moveFeedbackTimeout !== undefined) {
      window.clearTimeout(moveFeedbackTimeout);
    }

    moveFeedbackTimeout = undefined;
    movedPathKey = undefined;
    movedDirection = undefined;
  }

  function showMoveFeedback(pathKey: string, direction: -1 | 1) {
    clearMoveFeedback();

    movedPathKey = pathKey;
    movedDirection = direction;
    moveFeedbackTimeout = window.setTimeout(clearMoveFeedback, 1100);
  }

  function applyOpenEdit() {
    if (editingPathKey === undefined) {
      return;
    }

    applyEdit(editingPathKey);
  }

  function save() {
    applyOpenEdit();
    onSave(cloneItems(items));
  }

  let items = $state<EditableNestedListItem[]>(
    cloneItems(untrack(() => initialItems)),
  );
  let editingPathKey = $state<string | undefined>();
  let editingText = $state("");
  let movedPathKey = $state<string | undefined>();
  let movedDirection = $state<-1 | 1 | undefined>();
  let moveFeedbackTimeout: number | undefined;
  const parentDisplay = $derived(getDisplayParts(parentText));

  onDestroy(clearMoveFeedback);
</script>

<div class="nested-items-wrapper">
  <div class="modal-heading">
    {#if parentDisplay.timeRange}
      <div class="parent-time-range">{parentDisplay.timeRange}</div>
    {/if}
    <div class="parent-title">{parentDisplay.title}</div>
  </div>

  <div class="nested-items-list">
    {#if items.length === 0}
      <div class="empty-state">No nested items</div>
    {:else}
      {#each items as item, index}
        {@render itemCard(
          item,
          [index],
          0,
          index > 0,
          index < items.length - 1,
        )}
      {/each}
    {/if}

    <button class="add-root-row" onclick={addRootItem} type="button">
      <Plus aria-hidden="true" />
      <span>Add item</span>
    </button>
  </div>

  <div class="footer-buttons">
    <button class="mod-cta" onclick={save} type="button">Save</button>
    <button onclick={onCancel} type="button">Cancel</button>
  </div>
</div>

{#snippet itemCard(
  item: EditableNestedListItem,
  path: number[],
  depth: number,
  canMoveUp: boolean,
  canMoveDown: boolean,
)}
  {@const pathKey = path.join(".")}
  {@const display = getDisplayParts(item.text)}

  <div
    class="nested-item-card"
    class:is-nested={depth > 0}
    class:recently-moved={pathKey === movedPathKey}
  >
    <div class="nested-item-row" class:is-editing={editingPathKey === pathKey}>
      <div class="nested-item-main">
        {#if isTask(item)}
          <button
            class="item-marker item-marker-button"
            class:is-task={isTask(item)}
            aria-label={getTaskCompletionToggleLabel(item)}
            aria-pressed={isTaskComplete(item)}
            onclick={() => toggleTaskCompletion(path)}
            title={getTaskCompletionToggleLabel(item)}
            type="button"
          >
            {#if isTaskComplete(item)}
              <SquareCheck aria-hidden="true" />
            {:else}
              <Square aria-hidden="true" />
            {/if}
          </button>
        {:else}
          <span class="item-marker" aria-hidden="true">
            <span class="bullet-dot"></span>
          </span>
        {/if}

        {#if editingPathKey === pathKey}
          <div class="edit-form">
            <input
              aria-label="Nested item text"
              onkeydown={(event) => {
                if (event.key === "Enter") {
                  applyEdit(pathKey);
                }

                if (event.key === "Escape") {
                  cancelEdit();
                }
              }}
              bind:value={editingText}
              use:focusOnMount
            />
          </div>
        {:else}
          <span class="item-content">
            {#if display.timeRange}
              <span class="item-time-range">{display.timeRange}</span>
            {/if}
            <span class="item-text">{display.title}</span>
          </span>
        {/if}

        {#if pathKey === movedPathKey}
          <span class="move-feedback">
            {movedDirection === -1 ? "Moved up" : "Moved down"}
          </span>
        {/if}
      </div>

      <div class="nested-item-actions">
        {#if editingPathKey === pathKey}
          <div class="action-group edit-actions" aria-label="Confirm edit">
            <button
              class="icon-button confirm"
              aria-label="Update"
              disabled={editingText.trim().length === 0}
              onclick={() => applyEdit(pathKey)}
              title="Update"
              type="button"
            >
              <Check aria-hidden="true" />
            </button>
            <button
              class="icon-button"
              aria-label="Cancel edit"
              onclick={cancelEdit}
              title="Cancel"
              type="button"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        {:else}
          <div class="action-group" aria-label="Move item">
            <button
              class="icon-button"
              aria-label="Move up"
              disabled={!canMoveUp}
              onclick={() => moveItem(path, -1)}
              title="Move up"
              type="button"
            >
              <ChevronUp aria-hidden="true" />
            </button>
            <button
              class="icon-button"
              aria-label="Move down"
              disabled={!canMoveDown}
              onclick={() => moveItem(path, 1)}
              title="Move down"
              type="button"
            >
              <ChevronDown aria-hidden="true" />
            </button>
          </div>

          <span class="action-divider" aria-hidden="true"></span>

          <div class="action-group" aria-label="Edit item">
            <button
              class="icon-button"
              aria-label="Edit"
              onclick={() => beginEdit(pathKey, item)}
              title="Edit"
              type="button"
            >
              <Pencil aria-hidden="true" />
            </button>
            <button
              class="icon-button"
              aria-label="Add child"
              onclick={() => addChild(path)}
              title="Add child"
              type="button"
            >
              <ListPlus aria-hidden="true" />
            </button>
            <button
              class="icon-button"
              class:task-enabled={isTask(item)}
              aria-label={getTaskToggleLabel(item)}
              aria-pressed={isTask(item)}
              onclick={() => toggleTask(path)}
              title={getTaskToggleLabel(item)}
              type="button"
            >
              {#if isTask(item)}
                <SquareCheck aria-hidden="true" />
              {:else}
                <Square aria-hidden="true" />
              {/if}
            </button>
            <button
              class="icon-button danger"
              aria-label="Delete"
              onclick={() => deleteItem(path)}
              title="Delete"
              type="button"
            >
              <Trash2 aria-hidden="true" />
            </button>
          </div>
        {/if}
      </div>
    </div>

    {#if item.children && item.children.length > 0}
      <div class="children-stack">
        {#each item.children as child, childIndex}
          {@render itemCard(
            child,
            [...path, childIndex],
            depth + 1,
            childIndex > 0,
            childIndex < item.children.length - 1,
          )}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->

<style>
  :global(.modal.day-planner-nested-items-modal) {
    width: min(900px, calc(100vw - 48px));
    max-width: calc(100vw - 48px);
  }

  :global(.modal.day-planner-nested-items-modal .modal-title) {
    display: none;
  }

  .nested-items-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-4);

    width: 100%;
    min-width: 0;
  }

  .modal-heading {
    min-width: 0;
    padding-inline-end: var(--size-4-8);
  }

  .parent-time-range {
    margin-bottom: var(--size-2-1);

    font-size: var(--font-ui-smaller);
    font-weight: var(--font-medium);
    line-height: 1.2;
    color: var(--text-muted);
  }

  .parent-title {
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    line-height: 1.25;
    color: var(--text-normal);
  }

  .nested-items-list {
    --nested-items-separator-color: color-mix(
      in srgb,
      var(--background-modifier-border) 84%,
      var(--text-faint)
    );
    --nested-items-nested-separator-color: color-mix(
      in srgb,
      var(--background-modifier-border) 42%,
      transparent
    );

    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--nested-items-separator-color);
  }

  .add-root-row {
    display: inline-flex;
    gap: var(--size-2-2);
    align-items: center;
    justify-content: center;

    width: 100%;
    height: auto;
    min-height: 44px;
    padding: var(--size-4-3);

    font-size: var(--font-ui-medium);
    color: var(--text-muted);

    background: transparent;
    border: 0;
    border-block: 1px solid var(--nested-items-nested-separator-color);
    border-radius: 0;
    box-shadow: none;
  }

  .add-root-row:hover {
    color: var(--interactive-accent);
    background-color: var(--background-modifier-hover);
  }

  .nested-item-card {
    position: relative;
    min-width: 0;
  }

  .nested-items-list > .nested-item-card + .nested-item-card {
    border-top: 1px solid var(--nested-items-separator-color);
  }

  .nested-item-card.recently-moved {
    background-color: color-mix(
      in srgb,
      var(--interactive-accent) 12%,
      transparent
    );
    box-shadow: inset 3px 0 0 var(--interactive-accent);
    animation: nested-item-move-feedback 1.1s ease-out;
  }

  .nested-item-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) max-content;
    gap: var(--size-4-2);
    align-items: center;

    min-width: 0;
    padding: var(--size-4-3);
  }

  .nested-item-row.is-editing {
    background-color: color-mix(
      in srgb,
      var(--interactive-accent) 7%,
      transparent
    );
    box-shadow: inset 2px 0 0
      color-mix(in srgb, var(--interactive-accent) 55%, transparent);
  }

  .children-stack {
    display: flex;
    flex-direction: column;
    padding-left: var(--size-4-6);
    border-top: 1px solid var(--nested-items-nested-separator-color);
  }

  .children-stack > .nested-item-card + .nested-item-card {
    border-top: 1px solid var(--nested-items-nested-separator-color);
  }

  .nested-item-main {
    display: flex;
    gap: var(--size-4-3);
    align-items: flex-start;
    min-width: 0;
  }

  .nested-item-row.is-editing .nested-item-main {
    align-items: center;
  }

  .item-marker {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;

    width: 18px;
    height: 1.4em;

    color: var(--text-faint);
  }

  .item-marker-button {
    cursor: pointer;

    min-width: 0;
    min-height: 0;
    padding: 0;

    line-height: 1;

    background-color: transparent;
    border: 0;
    border-radius: var(--radius-s);
    box-shadow: none;
  }

  .item-marker-button:hover {
    background-color: var(--background-modifier-hover);
  }

  .item-marker.is-task,
  .task-enabled {
    color: var(--interactive-accent);
  }

  .item-marker :global(svg) {
    width: 16px;
    height: 16px;
    stroke-width: 2.1;
  }

  .bullet-dot {
    width: 5px;
    height: 5px;
    background-color: currentcolor;
    border-radius: 50%;
  }

  .item-content {
    display: flex;
    flex-direction: column;
    gap: var(--size-2-1);
    min-width: 0;
  }

  .item-time-range {
    font-size: var(--font-ui-smaller);
    font-weight: var(--font-normal);
    line-height: 1.2;
    color: var(--text-muted);
  }

  .item-text {
    min-width: 0;
    font-weight: var(--font-medium);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .edit-form {
    flex: 1 1 auto;
    min-width: 0;
  }

  .edit-form input {
    width: 100%;
    min-width: 0;
    height: 32px;
    padding: 0 0 1px;

    font: inherit;
    color: var(--text-normal);

    appearance: none;
    background-color: transparent;
    border: 0;
    border-bottom: 1px solid var(--background-modifier-border);
    border-radius: 0;
    box-shadow: none;
  }

  .edit-form input:focus {
    border-bottom-color: var(--interactive-accent);
    outline: none;
    box-shadow: 0 1px 0 0
      color-mix(in srgb, var(--interactive-accent) 35%, transparent);
  }

  .move-feedback {
    flex: 0 0 auto;

    padding: var(--size-2-1) var(--size-4-1);

    font-size: var(--font-ui-smaller);
    line-height: 1;
    color: var(--interactive-accent);

    background-color: color-mix(
      in srgb,
      var(--interactive-accent) 12%,
      transparent
    );
    border: 1px solid
      color-mix(in srgb, var(--interactive-accent) 24%, transparent);
    border-radius: 999px;
  }

  .nested-item-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2-2);
    align-items: center;
    justify-content: flex-end;

    min-width: 0;
  }

  .action-group {
    display: inline-flex;
    gap: var(--size-2-1);
    align-items: center;
  }

  .edit-actions {
    padding-inline-start: var(--size-2-1);
  }

  .action-divider {
    display: inline-block;

    width: 1px;
    height: 18px;
    margin-inline: var(--size-2-1);

    background-color: var(--nested-items-separator-color);
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 28px;
    min-width: 28px;
    height: 28px;
    padding: 0;

    color: var(--text-muted);

    background-color: transparent;
    border: 0;
    border-radius: var(--radius-s);
    box-shadow: none;
  }

  .icon-button:disabled {
    cursor: default;
    opacity: 0.32;
  }

  .icon-button:not(:disabled):hover,
  .icon-button.task-enabled:hover {
    color: var(--interactive-accent);
    background-color: var(--background-modifier-hover);
  }

  .icon-button.task-enabled {
    color: var(--interactive-accent);
  }

  .icon-button.confirm {
    color: var(--interactive-accent);
  }

  .icon-button.confirm:not(:disabled):hover {
    background-color: color-mix(
      in srgb,
      var(--interactive-accent) 12%,
      transparent
    );
  }

  .icon-button.danger:not(:disabled):hover {
    color: var(--text-error);
    background-color: color-mix(in srgb, var(--text-error) 10%, transparent);
  }

  .icon-button :global(svg),
  .add-root-row :global(svg) {
    width: 16px;
    height: 16px;
    stroke-width: 2.2;
  }

  .empty-state {
    pointer-events: none;
    padding: var(--size-4-4);
    color: var(--text-muted);
    text-align: center;
  }

  .footer-buttons {
    display: flex;
    flex-direction: row-reverse;
    gap: var(--size-4-2);
  }

  @keyframes nested-item-move-feedback {
    0% {
      background-color: color-mix(
        in srgb,
        var(--interactive-accent) 18%,
        transparent
      );
    }

    100% {
      background-color: transparent;
    }
  }

  @media (width <= 760px) {
    :global(.modal.day-planner-nested-items-modal) {
      width: min(100vw - 32px, 560px);
      max-width: calc(100vw - 32px);
    }

    .nested-items-wrapper {
      gap: var(--size-4-3);
    }

    .modal-heading {
      padding-inline-end: var(--size-4-6);
    }

    .parent-title {
      font-size: var(--font-ui-medium);
    }

    .nested-item-row {
      grid-template-columns: 16px minmax(0, 1fr);
      gap: var(--size-2-3) var(--size-4-2);
      align-items: start;
      padding: var(--size-4-4) var(--size-4-1) var(--size-4-2);
    }

    .nested-item-main {
      display: contents;
    }

    .item-marker {
      grid-column: 1;
      width: 16px;
      height: 1.4em;
    }

    .item-content,
    .edit-form {
      grid-column: 2;
    }

    .item-text,
    .edit-form input {
      font-size: var(--font-ui-small);
    }

    .item-time-range {
      font-size: var(--font-ui-smaller);
    }

    .nested-item-actions {
      grid-column: 2;
      gap: var(--size-2-1);
      justify-content: flex-end;
      justify-self: end;
    }

    .action-group {
      gap: 0;
    }

    .action-divider {
      height: 16px;
      margin-inline: var(--size-2-1);
      background-color: var(--nested-items-nested-separator-color);
    }

    .icon-button {
      width: 24px;
      min-width: 24px;
      height: 24px;
      color: var(--text-muted);
    }

    .icon-button.task-enabled {
      color: color-mix(
        in srgb,
        var(--interactive-accent) 84%,
        var(--text-muted)
      );
    }

    .icon-button :global(svg) {
      width: 14px;
      height: 14px;
      stroke-width: 2.1;
    }

    .children-stack {
      padding-left: var(--size-4-2);
    }

    .add-root-row {
      min-height: 48px;
    }
  }
</style>
