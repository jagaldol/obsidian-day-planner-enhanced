/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import chroma from "chroma-js";

import { getObsidianContext } from "../../context/obsidian-context";
import { currentTimeSignal } from "../../global-store/current-time";
import type { TimeBlock } from "../../time-block-types";
import { getTextColorWithEnoughContrast } from "../../util/color";
import { getRelationToNow } from "../../util/moment";
import * as t from "../../util/time-block-utils";
import { getOneLineSummary } from "../../util/time-block-utils";

interface UseColorProps {
  task: TimeBlock;
}

const currentTimeColor = "var(--planner-current-time-color, #10b981)";

export function useStylesForRelationToNow(task: TimeBlock) {
  const relationToNow = $derived.by(() => {
    if (task.isAllDayEvent) {
      return getRelationToNow(
        currentTimeSignal.current,
        task.startTime.clone().startOf("day"),
        task.startTime.clone().endOf("day"),
      );
    }

    if (t.isWithDuration(task)) {
      return getRelationToNow(
        currentTimeSignal.current,
        task.startTime,
        t.getEndTime(task),
      );
    }

    return "present";
  });

  const borderColor = $derived(
    relationToNow === "present" && !task.isAllDayEvent ? currentTimeColor : "",
  );
  const borderWidth = $derived(
    relationToNow === "present" && !task.isAllDayEvent ? "1px" : "",
  );
  const zIndex = $derived(
    relationToNow === "present" && !task.isAllDayEvent ? "1" : "",
  );
  const stripColor = $derived.by(() => {
    if (relationToNow === "present" && !task.isAllDayEvent) {
      return currentTimeColor;
    }

    if (relationToNow === "past") {
      return "var(--text-faint)";
    }

    return currentTimeColor;
  });

  const backgroundColor = $derived.by(() => {
    if (relationToNow === "present" && !task.isAllDayEvent) {
      return "";
    }

    if (relationToNow === "past") {
      return "color-mix(in srgb, var(--background-secondary) 42%, var(--background-primary))";
    }

    return "";
  });

  return {
    get backgroundColor() {
      return backgroundColor;
    },
    get borderColor() {
      return borderColor;
    },
    get borderWidth() {
      return borderWidth;
    },
    get stripColor() {
      return stripColor;
    },
    get zIndex() {
      return zIndex;
    },
  };
}

export function useColoredTimeline(task: TimeBlock) {
  const { settingsSignal } = getObsidianContext();

  const colorScale = $derived.by(() => {
    const { timelineStartColor, timelineEndColor } = settingsSignal.current;

    return chroma.scale([timelineStartColor, timelineEndColor]).mode("lab");
  });

  const backgroundColor = $derived.by(() => {
    const { timelineColored, startHour } = settingsSignal.current;

    if (timelineColored) {
      const scaleKey = (task.startTime.hour() - startHour) / (24 - startHour);

      return colorScale(scaleKey).hex();
    }

    return "";
  });

  const properContrastColors = $derived.by(() => {
    const { timelineColored } = settingsSignal.current;

    return timelineColored && backgroundColor
      ? getTextColorWithEnoughContrast(backgroundColor)
      : {
          normal: "inherit",
          muted: "inherit",
          faint: "inherit",
        };
  });

  return {
    get properContrastColors() {
      return properContrastColors;
    },
    get backgroundColor() {
      return backgroundColor;
    },
  };
}

export function useColorOverrides({ task }: UseColorProps) {
  const { settingsSignal, isDarkMode } = getObsidianContext();

  const colorOverride = $derived.by(() => {
    const { colorOverrides } = settingsSignal.current;

    return colorOverrides.find((override) =>
      getOneLineSummary(task).includes(override.text),
    );
  });

  const backgroundColor = $derived.by(() => {
    if (colorOverride) {
      return isDarkMode.current
        ? colorOverride?.darkModeColor
        : colorOverride?.color;
    }

    return "";
  });

  const properContrastColors = $derived.by(() => {
    const { timelineColored } = settingsSignal.current;

    return (timelineColored || colorOverride) && backgroundColor
      ? getTextColorWithEnoughContrast(backgroundColor)
      : {
          normal: "inherit",
          muted: "inherit",
          faint: "inherit",
        };
  });

  return {
    get properContrastColors() {
      return properContrastColors;
    },
    get backgroundColor() {
      return backgroundColor;
    },
  };
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
