<script generics="T" lang="ts">
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
  import { type Snippet } from "svelte";

  // eslint-disable-next-line no-undef
  type SnippetProps = T & {
    isActive: boolean;
    setIsActive: (isActive: boolean) => void;
  };

  type Props = {
    // eslint-disable-next-line no-undef
    blocks: T[];
    block: Snippet<[SnippetProps]>;
  };

  const { blocks, block }: Props = $props();

  let activeBlock = $state<number>();

  function createSetActiveBlock(i: number) {
    return (isActive: boolean) => {
      activeBlock = isActive ? i : undefined;
    };
  }
</script>

{#each blocks as blockProps, i}
  {@const isActive = activeBlock === i}

  {#if activeBlock === undefined || isActive}
    {@render block({
      setIsActive: createSetActiveBlock(i),
      isActive,
      ...blockProps,
    })}
  {/if}
{/each}
<!-- eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -->
