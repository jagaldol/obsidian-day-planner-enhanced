/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { OffsetOptions } from "@floating-ui/dom";
import { isNotVoid } from "typed-assert";

import { floatingUiOffset } from "../constants";

export function createOffsetFnWithFrozenCrossAxis(): OffsetOptions {
  let initialFloatingRectWidth: number | undefined;

  return ({ rects: { reference, floating } }) => {
    if (initialFloatingRectWidth === undefined) {
      initialFloatingRectWidth = floating.width;
    }

    isNotVoid(initialFloatingRectWidth);

    return {
      mainAxis: floatingUiOffset,
      crossAxis: reference.width / 2 - initialFloatingRectWidth / 2,
    };
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
