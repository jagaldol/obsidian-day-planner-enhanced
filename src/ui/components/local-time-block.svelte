<script lang="ts">
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
