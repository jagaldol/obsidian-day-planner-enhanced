<script lang="ts">
  /* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import type { Snippet } from "svelte";

  import type { LocalTask } from "../../task-types";
  import { hoverPreview } from "../actions/hover-preview";
  import type { HTMLActionArray } from "../actions/use-actions";

  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  const {
    task,
    bottomDecoration,
    blockEndDecoration,
    isActive = false,
    use = [],
    onpointerup,
  }: {
    isActive?: boolean;
    task: LocalTask;
    bottomDecoration?: Snippet;
    blockEndDecoration?: Snippet;
    use?: HTMLActionArray;
    onpointerup?: (event: PointerEvent) => void;
  } = $props();
</script>

<TimeBlockBase
  --time-block-bg-color={isActive
    ? "color-mix(in srgb, var(--color-accent) 8%, var(--background-primary))"
    : ""}
  --time-block-box-shadow={isActive ? "none" : ""}
  --time-block-outline-color={isActive ? "var(--color-accent)" : ""}
  --time-block-outline-width={isActive ? "2px" : ""}
  --time-block-strip-color={isActive ? "var(--color-accent)" : ""}
  --time-block-z-index={isActive ? "2" : ""}
  {blockEndDecoration}
  {onpointerup}
  {task}
  use={[...use, hoverPreview(task)]}
>
  <RenderedMarkdown {task}>
    {@render bottomDecoration?.()}
  </RenderedMarkdown>
</TimeBlockBase>
<!-- eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. -->
