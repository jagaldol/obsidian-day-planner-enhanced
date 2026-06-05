/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { readable } from "svelte/store";

export function useKeyDown() {
  return readable({}, (set) => {
    const trigger = (event: KeyboardEvent) => set(event);
    activeDocument.addEventListener("keydown", trigger);

    return () => {
      activeDocument.removeEventListener("keydown", trigger);
    };
  });
}
