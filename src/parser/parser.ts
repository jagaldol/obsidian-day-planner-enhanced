/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { timeRangeAtStartOfLineRegExp } from "../regexp";
import { getDiffInMinutes } from "../util/moment";
import type { Moment } from "../util/obsidian-moment";

import { parseTime } from "./time";

const obsidianTag = String.raw`#[\p{L}\p{M}\p{N}_/-]+`;
const leadingObsidianTagsRegExp = new RegExp(
  String.raw`^(?:${obsidianTag}(?:\s+|$))+`,
  "u",
);

function splitMarkdownListPrefix(line: string) {
  const match = line.match(/^(\s*(?:\d+[.)]|[-*+])\s+(?:\[[^\]]\]\s+)?)(.*)$/u);

  if (match) {
    return {
      prefix: match[1] ?? "",
      text: match[2] ?? "",
    };
  }

  const checkboxMatch = line.match(/^(\s*\[[^\]]\]\s+)(.*)$/u);

  if (checkboxMatch) {
    return {
      prefix: checkboxMatch[1] ?? "",
      text: checkboxMatch[2] ?? "",
    };
  }

  return {
    prefix: "",
    text: line,
  };
}

function getLeadingObsidianTags(text: string) {
  return text.match(leadingObsidianTagsRegExp)?.[0] ?? "";
}

export interface TimeRangeMatch {
  end?: string;
  endIndex: number;
  start: string;
  startIndex: number;
  timeRange: string;
}

function toTimeRangeMatch(
  match: RegExpMatchArray,
  startIndex: number,
): TimeRangeMatch | null {
  const start = match.groups?.["start"];

  if (!start) {
    return null;
  }

  return {
    end: match.groups?.["end"],
    endIndex: startIndex + match[0].length,
    start,
    startIndex,
    timeRange: match[0],
  };
}

/**
 * Matches a timestamp at the start of task text. A complete range may also
 * follow one or more leading Obsidian tags, but arbitrary mid-line clocks stay
 * untimed.
 */
export function getTimeRangeMatch(line: string): TimeRangeMatch | null {
  const { prefix, text } = splitMarkdownListPrefix(line);
  const directMatch = text.match(timeRangeAtStartOfLineRegExp);

  if (directMatch) {
    return toTimeRangeMatch(directMatch, prefix.length);
  }

  const leadingTags = getLeadingObsidianTags(text);

  if (!leadingTags) {
    return null;
  }

  const taggedMatch = text
    .slice(leadingTags.length)
    .match(timeRangeAtStartOfLineRegExp);

  if (!taggedMatch?.groups?.["end"]) {
    return null;
  }

  return toTimeRangeMatch(taggedMatch, prefix.length + leadingTags.length);
}

function replaceTextSpan(
  line: string,
  startIndex: number,
  endIndex: number,
  replacement: string,
) {
  const before = line.slice(0, startIndex).trimEnd();
  const after = line.slice(endIndex).trimStart();

  return [before, replacement, after].filter(Boolean).join(" ");
}

export function removeTimeRangeFromLine(line: string) {
  const match = getTimeRangeMatch(line);

  return match
    ? replaceTextSpan(line, match.startIndex, match.endIndex, "")
    : line;
}

export function replaceOrPrependTimeRange(line: string, timeRange: string) {
  const { prefix, text } = splitMarkdownListPrefix(line);
  const match = getTimeRangeMatch(line);

  if (match) {
    return replaceTextSpan(line, match.startIndex, match.endIndex, timeRange);
  }

  const leadingTags = getLeadingObsidianTags(text);
  const insertionIndex = prefix.length + leadingTags.length;

  return replaceTextSpan(line, insertionIndex, insertionIndex, timeRange);
}

export function getTimeFromLine({ line, day }: { line: string; day: Moment }) {
  const match = getTimeRangeMatch(line);

  if (!match) {
    return null;
  }

  const { start, end } = match;

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
