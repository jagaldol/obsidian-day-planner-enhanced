/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import * as lucideSvelte from "lucide-svelte";
import type { IconProps } from "lucide-svelte";
import type { Component } from "svelte";

type ObsidianIcon = Component<IconProps>;

const obsidianIcon = (IconComponent: unknown): ObsidianIcon => {
  const component = IconComponent as ObsidianIcon;

  return (internals, props) => {
    const newProps = {
      ...props,
      ["class"]: `${props.class || ""} svg-icon`,
    };

    return component(internals, newProps);
  };
};

const ellipsis = obsidianIcon(lucideSvelte.Ellipsis);
const ellipsisVertical = obsidianIcon(lucideSvelte.EllipsisVertical);
const settings = obsidianIcon(lucideSvelte.Settings);
const chevronLeft = obsidianIcon(lucideSvelte.ChevronLeft);
const chevronRight = obsidianIcon(lucideSvelte.ChevronRight);
const calendarArrowUp = obsidianIcon(lucideSvelte.CalendarArrowUp);
const columns3 = obsidianIcon(lucideSvelte.Columns3);
const tableColumnsSplit = obsidianIcon(lucideSvelte.TableColumnsSplit);
const search = obsidianIcon(lucideSvelte.Search);
const alertTriangle = obsidianIcon(lucideSvelte.TriangleAlert);
const info = obsidianIcon(lucideSvelte.Info);
const zap = obsidianIcon(lucideSvelte.Zap);
const refreshCwOff = obsidianIcon(lucideSvelte.RefreshCwOff);
const gripHorizontal = obsidianIcon(lucideSvelte.GripHorizontal);
const play = obsidianIcon(lucideSvelte.Play);
const skipForward = obsidianIcon(lucideSvelte.SkipForward);
const stepForward = obsidianIcon(lucideSvelte.StepForward);
const timer = obsidianIcon(lucideSvelte.Timer);
const clock = obsidianIcon(lucideSvelte.Clock);

export {
  alertTriangle as AlertTriangle,
  calendarArrowUp as CalendarArrowUp,
  chevronLeft as ChevronLeft,
  chevronRight as ChevronRight,
  clock as Clock,
  columns3 as Columns3,
  ellipsis as Ellipsis,
  ellipsisVertical as EllipsisVertical,
  gripHorizontal as GripHorizontal,
  info as Info,
  play as Play,
  refreshCwOff as RefreshCwOff,
  search as Search,
  settings as Settings,
  skipForward as SkipForward,
  stepForward as StepForward,
  tableColumnsSplit as TableColumnsSplit,
  timer as Timer,
  zap as Zap,
};
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
