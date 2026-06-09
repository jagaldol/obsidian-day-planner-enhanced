/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { isNotVoid } from "typed-assert";

import { timeRangeAtStartOfLineRegExp } from "../regexp";
import { getDiffInMinutes } from "../util/moment";
import type { Moment } from "../util/obsidian-moment";

import { parseTime } from "./time";

function splitMarkdownListPrefix(line: string) {
  const match = line.match(/^(\s*(?:\d+[.)]|[-*+])\s+(?:\[[^\]]\]\s+)?)(.*)$/u);

  if (match) {
    return {
      prefix: match[1],
      text: match[2],
    };
  }

  const checkboxMatch = line.match(/^(\s*\[[^\]]\]\s+)(.*)$/u);

  if (checkboxMatch) {
    return {
      prefix: checkboxMatch[1],
      text: checkboxMatch[2],
    };
  }

  return {
    prefix: "",
    text: line,
  };
}

export function replaceOrPrependTimeRange(line: string, timeRange: string) {
  const { prefix, text } = splitMarkdownListPrefix(line);

  if (timeRangeAtStartOfLineRegExp.test(text)) {
    return `${prefix}${text.replace(timeRangeAtStartOfLineRegExp, timeRange)}`;
  }

  return `${prefix}${timeRange} ${text}`;
}

export function getTimeFromLine({ line, day }: { line: string; day: Moment }) {
  const { text } = splitMarkdownListPrefix(line);
  const match = text.match(timeRangeAtStartOfLineRegExp);

  if (!match?.groups) {
    return null;
  }

  const {
    groups: { start, end },
  } = match;

  isNotVoid(
    start,
    "Expected to find 'start' group on a timestamp regexp match",
  );

  const startTime = parseTime(start, day);

  let durationMinutes: number | undefined;

  if (end) {
    const endTime = parseTime(end, day);

    // todo: handle edge, use default duration
    if (endTime.isAfter(startTime)) {
      durationMinutes = getDiffInMinutes(endTime, startTime);
    } else {
      durationMinutes = getDiffInMinutes(
        startTime,
        endTime.clone().add(1, "day"),
      );
    }
  }

  return {
    startTime,
    durationMinutes,
  };
}

export function compareTimestamps(a: string, b: string) {
  const now = window.moment();

  const aTime = getTimeFromLine({ line: a, day: now });
  const bTime = getTimeFromLine({ line: b, day: now });

  if (!aTime && !bTime) {
    return 0;
  }

  if (!aTime) {
    return 1;
  }

  if (!bTime) {
    return -1;
  }

  return aTime.startTime.diff(bTime.startTime);
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
