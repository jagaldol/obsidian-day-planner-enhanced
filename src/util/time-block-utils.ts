/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { pipe } from "effect";
import { get } from "svelte/store";

import { bullet, defaultDayFormat, emDash } from "../constants";
import { settings } from "../global-store/settings";
import { replaceOrPrependTimeRange } from "../parser/parser";
import { obsidianBlockIdRegExp, timeRangeAtStartOfLineRegExp } from "../regexp";
import type { DayPlannerSettings } from "../settings";
import {
  isListItemSourced,
  isRemote,
  type EditableTimeBlock,
  type PlanTimeBlock,
  type RemoteTimeBlock,
  type TimeBlock,
  type TimelineSegment,
  type UnwrittenTimeBlock,
  type WithDuration,
  type WriteDestination,
} from "../time-block-types";

import { getId } from "./id";
import {
  type Node,
  createMarkdownListTokens,
  getFirstLine,
  getFirstLineAsMarkdown,
  getIndentationForListParagraph,
  indentLines,
  removeListTokens,
} from "./markdown";
import * as m from "./moment";
import {
  addMinutes,
  getMinutesSinceMidnight,
  minutesToMoment,
  minutesToMomentOfDay,
} from "./moment";
import type { Moment } from "./obsidian-moment";
import { deleteProps, updateScheduledPropInText } from "./props";

export function getEndMinutes(timeBlock: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return (
    getMinutesSinceMidnight(timeBlock.startTime) + timeBlock.durationMinutes
  );
}

export function getEndTime(timeBlock: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return timeBlock.startTime.clone().add(timeBlock.durationMinutes, "minutes");
}

export function createTimelineSegment(
  timeBlock: WithDuration<TimeBlock>,
  startTime: Moment,
  endTime: Moment,
): TimelineSegment | undefined {
  const sourceEndTime = getEndTime(timeBlock);
  const startsBeforeSegment = startTime.isAfter(timeBlock.startTime, "minute");
  const continuesAfterSegment = endTime.isBefore(sourceEndTime, "minute");

  if (!startsBeforeSegment && !continuesAfterSegment) {
    return undefined;
  }

  return {
    continuesAfterSegment,
    sourceDurationMinutes: timeBlock.durationMinutes,
    sourceStartTime: timeBlock.startTime.clone(),
    startsBeforeSegment,
  };
}

export function getTimelineSegmentSource<
  T extends WithDuration<EditableTimeBlock>,
>(timeBlock: T): T {
  if (!timeBlock.timelineSegment) {
    return timeBlock;
  }

  return {
    ...timeBlock,
    durationMinutes: timeBlock.timelineSegment.sourceDurationMinutes,
    startTime: timeBlock.timelineSegment.sourceStartTime.clone(),
    timelineSegment: undefined,
  };
}

export function isWithDuration<T extends TimeBlock>(
  timeBlock: T,
): timeBlock is WithDuration<T> {
  return Object.hasOwn(timeBlock, "durationMinutes");
}

const keySeparator = ":";

function getRemoteTimeBlockIdentity(timeBlock: RemoteTimeBlock) {
  const key: string[] = [];

  key.push(
    timeBlock.calendar.name,
    timeBlock.startTime.toISOString(false),
    timeBlock.summary,
  );

  return key.join(keySeparator);
}

// todo: should remove?
export function getRenderKey(timeBlock: WithDuration<TimeBlock> | TimeBlock) {
  if (isRemote(timeBlock)) {
    return getRemoteTimeBlockIdentity(timeBlock);
  }

  const key: string[] = [];

  if (isWithDuration(timeBlock)) {
    key.push(
      String(getMinutesSinceMidnight(timeBlock.startTime)),
      String(getEndMinutes(timeBlock)),
    );
  }

  if (isListItemSourced(timeBlock)) {
    const {
      path,
      position: {
        start: { line },
      },
    } = timeBlock;

    key.push(path, String(line));
  }

  key.push(timeBlock.text);

  return key.join(keySeparator);
}

export function getNotificationKey(timeBlock: WithDuration<PlanTimeBlock>) {
  const key: string[] = [];

  key.push(
    timeBlock.path,
    String(getMinutesSinceMidnight(timeBlock.startTime)),
    String(timeBlock.durationMinutes),
    timeBlock.text,
  );

  return key.join(keySeparator);
}

/**
 * Copies of tasks-plugin blocks go right under the original block, copies of
 * daily-note blocks get sent under the planner heading of the note matching
 * their start time.
 */
export function copy(
  original: WithDuration<EditableTimeBlock>,
): WithDuration<UnwrittenTimeBlock> {
  const source = getTimelineSegmentSource(original);

  if (source.source === "unwritten") {
    throw new Error("Cannot copy unwritten time blocks");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { path, position, ...withoutFileLocation } = source;

  return {
    ...withoutFileLocation,
    source: "unwritten",
    destination: getCopyDestination(source),
    id: getId(),
  };
}

function getCopyDestination(original: PlanTimeBlock): WriteDestination {
  if (original.source === "tasksPluginProp") {
    return {
      type: "line",
      path: original.path,
      line: original.position.end.line + 1,
    };
  }

  return { type: "plannerHeading" };
}

export function createTimestamp(
  startMinutes: number,
  durationMinutes: number,
  format: string,
  separator = " - ",
) {
  const { end, start } = createTimestampParts(
    startMinutes,
    durationMinutes,
    format,
  );

  return `${start}${separator}${end}`;
}

export function createTimestampParts(
  startMinutes: number,
  durationMinutes: number,
  format: string,
) {
  const start = minutesToMoment(startMinutes);
  const endMinutes = startMinutes + durationMinutes;

  return {
    end: formatTimestampEnd(endMinutes, format),
    start: start.format(format),
  };
}

function uses24HourFormat(format: string) {
  return /^(?:HH?|kk?)/.test(format);
}

function formatTimestampEnd(minutesSinceMidnight: number, format: string) {
  const shouldRenderEndOfDayAs24 =
    minutesSinceMidnight === 24 * 60 && uses24HourFormat(format);

  if (!shouldRenderEndOfDayAs24) {
    return addMinutes(minutesToMoment(0), minutesSinceMidnight).format(format);
  }

  const midnight = minutesToMoment(0).format(format);
  const hourToken = /^(?:HH?|kk?)/.exec(format)?.[0];

  if (!hourToken) {
    return midnight;
  }

  return `24${midnight.slice(minutesToMoment(0).format(hourToken).length)}`;
}

export function getEmptyTimeBlocksForDay() {
  return { withTime: [], noTime: [] };
}

export function getDayKey(day: Moment) {
  return day.format(defaultDayFormat);
}

export function toString(timeBlock: WithDuration<EditableTimeBlock>) {
  const updatedTimestamp = createTimestamp(
    getMinutesSinceMidnight(timeBlock.startTime),
    timeBlock.durationMinutes,
    get(settings).timestampFormat,
  );
  const listTokens = createMarkdownListTokens(timeBlock);

  const withUpdatedOrDeletedTimeRange = timeBlock.isAllDayEvent
    ? removeTimeRange(getFirstLine(timeBlock.text))
    : replaceOrPrependTimeRange(getFirstLine(timeBlock.text), updatedTimestamp);

  const updatedFirstLineText = updateScheduledPropInText(
    withUpdatedOrDeletedTimeRange,
    getDayKey(timeBlock.startTime),
  );

  const paragraphs = timeBlock.text
    .split("\n")
    .slice(1)
    .map((line) => getIndentationForListParagraph() + line)
    .join("\n");

  let result = `${listTokens} ${updatedFirstLineText}`;

  if (paragraphs) {
    result += "\n";
    result += paragraphs;
  }

  if (timeBlock.children && timeBlock.children.length > 0) {
    result += "\n";
    result += timeBlock.children
      .map((child) => getIndentedText(child, "\t"))
      .join("\n");
  }

  return result;
}

export function appendText(taskText: string, toAppend: string) {
  const blockIdMatch = taskText.match(obsidianBlockIdRegExp);

  if (blockIdMatch) {
    const blockId = blockIdMatch[0];

    return taskText.slice(0, blockIdMatch.index) + toAppend + blockId;
  }

  return taskText + toAppend;
}

export function create(props: {
  day: Moment;
  startMinutes: number;
  settings: DayPlannerSettings;
}): WithDuration<UnwrittenTimeBlock> {
  const { day, startMinutes, settings } = props;

  return {
    id: getId(),
    source: "unwritten",
    destination: { type: "plannerHeading" },
    durationMinutes: settings.defaultDurationMinutes,
    text: "New item",
    startTime: minutesToMomentOfDay(startMinutes, day),
    isAllDayEvent: false,
    symbol: "-",
    status:
      settings.eventFormatOnCreation === "task"
        ? settings.taskStatusOnCreation
        : undefined,
  };
}

export function getOneLineSummary(timeBlock: TimeBlock) {
  if (isRemote(timeBlock)) {
    return timeBlock.summary;
  }

  return removeTimeRangeFromStartOfLine(timeBlock.text);
}

export function truncateToRange<T extends WithDuration<TimeBlock>>(
  timeBlock: T,
  range: m.Range,
): T {
  const start = timeBlock.startTime.clone().startOf("day");
  const end = getEndTime(timeBlock).clone().endOf("day");

  const startOfRange = range.start.clone().startOf("day");
  const endOfRange = range.end.clone().add(1, "day").startOf("day");

  const truncatedBase = { ...timeBlock };

  if (start.isBefore(startOfRange)) {
    truncatedBase.durationMinutes = getEndTime(timeBlock).diff(
      startOfRange,
      "minutes",
    );

    truncatedBase.startTime = startOfRange;
    truncatedBase.truncated = [...(truncatedBase.truncated ?? []), "left"];
  }

  if (end.isAfter(endOfRange)) {
    truncatedBase.durationMinutes = m.getDiffInMinutes(
      truncatedBase.startTime,
      endOfRange,
    );

    truncatedBase.truncated = [...(truncatedBase.truncated ?? []), "right"];
  }

  return truncatedBase;
}

export function removeTimeRangeFromStartOfLine(text: string) {
  return text.replace(timeRangeAtStartOfLineRegExp, "");
}

function splitMarkdownListPrefix(text: string) {
  const match = text.match(/^(\s*(?:\d+[.)]|[-*+])\s+(?:\[[^\]]\]\s+)?)(.*)$/u);

  if (match) {
    return { prefix: match[1], text: match[2] };
  }

  const checkboxMatch = text.match(/^(\s*\[[^\]]\]\s+)(.*)$/u);

  if (!checkboxMatch) {
    return undefined;
  }

  return { prefix: checkboxMatch[1], text: checkboxMatch[2] };
}

export function removeTimeRange(text: string) {
  const listLine = splitMarkdownListPrefix(text);
  const prefix = listLine?.prefix ?? "";
  const textWithoutPrefix = listLine?.text ?? text;

  return `${prefix}${removeTimeRangeFromStartOfLine(textWithoutPrefix)
    .trim()
    .replace(/\s+/g, " ")}`;
}

export function isTimeEqual(a: EditableTimeBlock, b: EditableTimeBlock) {
  return (
    a.startTime.isSame(b.startTime) &&
    a.durationMinutes === b.durationMinutes &&
    a.isAllDayEvent === b.isAllDayEvent
  );
}

export function clamp<T extends WithDuration<TimeBlock>>(
  timeBlock: T,
  start: Moment,
  end: Moment,
): T {
  const clampedStartTime = timeBlock.startTime.isBefore(start)
    ? start
    : timeBlock.startTime;
  const endTime = getEndTime(timeBlock);
  const clampedEndTime = endTime.isAfter(end) ? end : endTime;
  const clampedDurationMinutes = clampedEndTime.diff(
    clampedStartTime,
    "minutes",
  );

  return {
    ...timeBlock,
    startTime: clampedStartTime,
    durationMinutes: clampedDurationMinutes,
  };
}

export function getBlockProps(
  timeBlock: TimeBlock,
  settings: DayPlannerSettings,
) {
  const result: string[] = [];

  if (settings.showTimestampInTaskBlock && isWithDuration(timeBlock)) {
    const sourceStartTime =
      timeBlock.timelineSegment?.sourceStartTime ?? timeBlock.startTime;
    const sourceDurationMinutes =
      timeBlock.timelineSegment?.sourceDurationMinutes ??
      timeBlock.durationMinutes;

    result.push(
      createTimestamp(
        getMinutesSinceMidnight(sourceStartTime),
        sourceDurationMinutes,
        settings.timestampFormat,
        emDash,
      ),
    );
  }

  if (isRemote(timeBlock)) {
    result.push(timeBlock.calendar.name);
  }

  return result.join(` ${bullet} `);
}

function isTimedLocalTimelineTask(
  timeBlock: TimeBlock,
): timeBlock is WithDuration<PlanTimeBlock> {
  return (
    (timeBlock.source === "dailyNoteDate" ||
      timeBlock.source === "tasksPluginProp") &&
    isWithDuration(timeBlock) &&
    !timeBlock.isAllDayEvent
  );
}

function getSourceLine(timeBlock: PlanTimeBlock) {
  return timeBlock.position.start.line;
}

type LocalTimeBlockChild = NonNullable<PlanTimeBlock["children"]>[number];

function isSameChildSourceLine(
  child: LocalTimeBlockChild,
  timeBlock: PlanTimeBlock,
) {
  return (
    child.path === timeBlock.path &&
    child.position.start.line === getSourceLine(timeBlock)
  );
}

function containsTimeBlockSourceLine(
  children: LocalTimeBlockChild[] | undefined,
  timeBlock: PlanTimeBlock,
): boolean {
  return (
    children?.some(
      (child) =>
        isSameChildSourceLine(child, timeBlock) ||
        containsTimeBlockSourceLine(child.children, timeBlock),
    ) ?? false
  );
}

function isNestedTimedLocalTask(
  timeBlock: TimeBlock,
  possibleParents: TimeBlock[],
): timeBlock is WithDuration<PlanTimeBlock> {
  if (!isTimedLocalTimelineTask(timeBlock)) {
    return false;
  }

  return possibleParents.some((possibleParent) => {
    if (
      possibleParent === timeBlock ||
      !isTimedLocalTimelineTask(possibleParent) ||
      possibleParent.path !== timeBlock.path
    ) {
      return false;
    }

    return (
      getSourceLine(possibleParent) < getSourceLine(timeBlock) &&
      containsTimeBlockSourceLine(possibleParent.children, timeBlock)
    );
  });
}

/**
 * Nested scheduled list items are rendered inside their timed parent block.
 * Only local plan blocks participate: iCal events and log/frontmatter blocks
 * are independent timeline records and must never be filtered here.
 */
export function hideNestedTimedLocalTasks<T extends TimeBlock>(
  timeBlocks: T[],
): T[] {
  return timeBlocks.filter(
    (timeBlock) => !isNestedTimedLocalTask(timeBlock, timeBlocks),
  );
}

export function toRenderableMarkdown(timeBlock: Node) {
  const formattedFirstLine = pipe(
    timeBlock,
    getFirstLineAsMarkdown,
    (node) => (timeBlock.status ? node : removeListTokens(node)),
    deleteProps,
    removeTimeRange,
  );

  const [, ...linesAfterFirst] = timeBlock.text.split("\n");

  const nestedListItems = getNestedListItems(timeBlock.children);

  return {
    listItem: formattedFirstLine,
    paragraphs: linesAfterFirst.join("\n"),
    nestedListItems,
  };
}

function getNestedListItems(children: Node[] | undefined) {
  let previousChildHasTimeRange: boolean | undefined;

  return children
    ?.flatMap((child) => {
      const childHasTimeRange = hasLeadingTimeRange(child);
      const result: string[] = [];

      if (
        previousChildHasTimeRange !== undefined &&
        previousChildHasTimeRange !== childHasTimeRange
      ) {
        result.push("", "---", "");
      }

      previousChildHasTimeRange = childHasTimeRange;
      result.push(getIndentedText(child, "", { formatTimeRanges: true }));

      return result;
    })
    .join("\n");
}

function hasLeadingTimeRange(node: Node) {
  return timeRangeAtStartOfLineRegExp.test(getFirstLine(node.text));
}

function wrapLeadingTimeRangeInCodeSpan(line: string) {
  const match = line.match(/^(\s*(?:\d+[.)]|[-*+])\s+(?:\[[^\]]\]\s+)?)(.*)$/u);
  const prefix = match?.[1];
  const text = match?.[2];

  if (!prefix || !text || !timeRangeAtStartOfLineRegExp.test(text)) {
    return line;
  }

  return (
    prefix +
    text.replace(
      timeRangeAtStartOfLineRegExp,
      (timeRange) => `\`${timeRange}\``,
    )
  );
}

function getIndentedText(
  root: Node,
  parentIndentation: string = "",
  options: { formatTimeRanges?: boolean } = {},
): string {
  const firstLine = options.formatTimeRanges
    ? wrapLeadingTimeRangeInCodeSpan(getFirstLineAsMarkdown(root))
    : getFirstLineAsMarkdown(root);
  const [, ...linesAfterFirst] = root.text.split("\n");

  let listItemLineWithParagraphs = parentIndentation + firstLine;

  if (linesAfterFirst.length > 0) {
    const indentedParagraphs = indentLines(
      linesAfterFirst,
      parentIndentation + getIndentationForListParagraph(),
    ).join("\n");

    listItemLineWithParagraphs += "\n";
    listItemLineWithParagraphs += indentedParagraphs;
  }

  return (root.children ?? []).reduce<string>((result, current) => {
    const indentation = "\t" + parentIndentation;

    return result + "\n" + getIndentedText(current, indentation, options);
  }, listItemLineWithParagraphs);
}

export function isCompleted(taskCheckmark?: string) {
  return taskCheckmark !== undefined && taskCheckmark.toLowerCase() === "x";
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
