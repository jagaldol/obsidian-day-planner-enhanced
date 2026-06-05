/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import chroma from "chroma-js";
import type { HexString } from "obsidian";

export interface ContrastColors {
  normal: HexString;
  muted: HexString;
  faint: HexString;
}

// just using values from the default themes to get good gradients for light and dark colors
const lightThemeColors: ContrastColors = {
  normal: "#222222",
  muted: "#5c5c5c",
  faint: "#666666",
};

const darkThemeColors: ContrastColors = {
  normal: "#dadada",
  muted: "#b3b3b3",
  faint: "#ababab",
};

export function getTextColorWithEnoughContrast(
  backgroundColor: HexString,
): ContrastColors {
  return chroma.contrast(backgroundColor, darkThemeColors.normal) >
    chroma.contrast(backgroundColor, lightThemeColors.normal)
    ? darkThemeColors
    : lightThemeColors;
}
