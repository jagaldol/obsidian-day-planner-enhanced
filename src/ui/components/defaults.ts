/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { cubicInOut } from "svelte/easing";

import { transitionDurationShort } from "../../constants";

export function createSlide(props: { axis: "x" | "y" }) {
  const { axis } = props;

  // Note: these presets are similar to what Obsidian uses
  return {
    duration: transitionDurationShort,
    easing: cubicInOut,
    axis,
  };
}
