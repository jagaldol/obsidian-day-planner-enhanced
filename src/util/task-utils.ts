/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { produce } from "immer";
import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";

import { bullet, defaultDayFormat, emDash } from "../constants";
import { settings } from "../global-store/settings";
import { replaceOrPrependTimeRange } from "../parser/parser";
import {
  obsidianBlockIdRegExp,
  scheduledPropRegExps,
  timeRangeAtStartOfLineRegExp,
} from "../regexp";
import type { DayPlannerSettings } from "../settings";
import {
  type BaseTask,
  isLocal,
  isRemote,
  type LocalTask,
  type RemoteTask,
  type Task,
  type TaskLocation,
  type TimelineSegment,
  type WithTime,
} from "../task-types";

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

export function getEndMinutes(task: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return getMinutesSinceMidnight(task.startTime) + task.durationMinutes;
}

export function getEndTime(task: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return task.startTime.clone().add(task.durationMinutes, "minutes");
}

export function createTimelineSegment(
  task: WithTime<Task>,
  startTime: Moment,
  endTime: Moment,
): TimelineSegment | undefined {
  const sourceEndTime = getEndTime(task);
  const startsBeforeSegment = startTime.isAfter(task.startTime, "minute");
  const continuesAfterSegment = endTime.isBefore(sourceEndTime, "minute");

  if (!startsBeforeSegment && !continuesAfterSegment) {
    return undefined;
  }

  return {
    continuesAfterSegment,
    sourceDurationMinutes: task.durationMinutes,
    sourceStartTime: task.startTime.clone(),
    startsBeforeSegment,
  };
}

export function getTimelineSegmentSource<T extends WithTime<LocalTask>>(
  task: T,
): T {
  if (!task.timelineSegment) {
    return task;
  }

  return {
    ...task,
    durationMinutes: task.timelineSegment.sourceDurationMinutes,
    startTime: task.timelineSegment.sourceStartTime.clone(),
    timelineSegment: undefined,
  };
}

// todo: remove this inconsistency
export function isWithTime<T extends Task>(task: T): task is WithTime<T> {
  return Object.hasOwn(task, "startTime") || !task.isAllDayEvent;
}

const keySeparator = ":";

function getRemoteTaskIdentity(task: RemoteTask) {
  const key: string[] = [];

  key.push(task.calendar.name, task.startTime.toISOString(false), task.summary);

  return key.join(keySeparator);
}

// todo: should remove?
export function getRenderKey(task: WithTime<Task> | Task) {
  if (isRemote(task)) {
    return getRemoteTaskIdentity(task);
  }

  const key: string[] = [];

  if (isWithTime(task)) {
    key.push(
      String(getMinutesSinceMidnight(task.startTime)),
      String(getEndMinutes(task)),
    );
  }

  if (task.location) {
    const {
      path,
      position: {
        start: { line },
      },
    } = task.location;

    key.push(path, String(line));
  }

  key.push(task.text);

  return key.join(keySeparator);
}

export function getNotificationKey(task: WithTime<Task>) {
  if (isRemote(task)) {
    return getRemoteTaskIdentity(task);
  }

  const key: string[] = [];

  key.push(
    task.location?.path ?? "blank",
    String(getMinutesSinceMidnight(task.startTime)),
    String(task.durationMinutes),
    task.text,
  );

  return key.join(keySeparator);
}

/**
 * Tasks with date prop are copied under the original task, tasks from daily
 * notes get sent under a heading based on the new date.
 */
export function copy(original: WithTime<LocalTask>): WithTime<LocalTask> {
  const source = getTimelineSegmentSource(original);
  let location: TaskLocation | undefined;

  if (hasDateFromProp(source)) {
    const originalLocation = source.location;

    isNotVoid(
      originalLocation,
      `Did not find location on task$ ${getOneLineSummary(original)}`,
    );

    location = produce(originalLocation, (draft) => {
      draft.position.start.line = draft.position.end.line + 1;
    });
  }

  return {
    ...source,
    location,
    id: getId(),
  };
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

  return formatEndOfDayAs24(format);
}

function formatEndOfDayAs24(format: string) {
  const midnight = minutesToMoment(0).format(format);
  const hourToken = /^(?:HH?|kk?)/.exec(format)?.[0];

  if (!hourToken) {
    return midnight;
  }

  return `24${midnight.slice(minutesToMoment(0).format(hourToken).length)}`;
}

export function getEmptyTasksForDay() {
  return { withTime: [], noTime: [] };
}

export function getDayKey(day: Moment) {
  return day.format(defaultDayFormat);
}

export function toString(task: WithTime<LocalTask>) {
  const updatedTimestamp = createTimestamp(
    getMinutesSinceMidnight(task.startTime),
    task.durationMinutes,
    get(settings).timestampFormat,
  );
  const listTokens = createMarkdownListTokens(task);

  const withUpdatedOrDeletedTimeRange = task.isAllDayEvent
    ? removeTimeRange(getFirstLine(task.text))
    : replaceOrPrependTimeRange(getFirstLine(task.text), updatedTimestamp);

  const updatedFirstLineText = updateScheduledPropInText(
    withUpdatedOrDeletedTimeRange,
    getDayKey(task.startTime),
  );

  const paragraphs = task.text
    .split("\n")
    .slice(1)
    .map((line) => getIndentationForListParagraph() + line)
    .join("\n");

  let result = `${listTokens} ${updatedFirstLineText}`;

  if (paragraphs) {
    result += "\n";
    result += paragraphs;
  }

  if (task.children && task.children.length > 0) {
    result += "\n";
    result += task.children
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
  text?: string;
  location?: TaskLocation;
  status?: string;
  isAllDayEvent?: boolean;
}): WithTime<LocalTask> {
  const {
    day,
    startMinutes,
    settings,
    location,
    text = "New item",
    status,
    isAllDayEvent = false,
  } = props;

  return {
    location,
    id: getId(),
    durationMinutes: settings.defaultDurationMinutes,
    text,
    startTime: minutesToMomentOfDay(startMinutes, day),
    isAllDayEvent,
    symbol: "-",
    status:
      status || settings.eventFormatOnCreation === "task"
        ? settings.taskStatusOnCreation
        : undefined,
  };
}

export function getOneLineSummary(task: Task) {
  if (isRemote(task)) {
    return task.summary;
  }

  return removeTimeRangeFromStartOfLine(task.text);
}

export function truncateToRange(task: WithTime<Task>, range: m.Range) {
  const start = task.startTime.clone().startOf("day");
  const end = getEndTime(task).clone().endOf("day");

  const startOfRange = range.start.clone().startOf("day");
  const endOfRange = range.end.clone().add(1, "day").startOf("day");

  const truncatedBase = { ...task };

  if (start.isBefore(startOfRange)) {
    truncatedBase.durationMinutes = getEndTime(task).diff(
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
    return {
      prefix: match[1],
      text: match[2],
    };
  }

  const checkboxMatch = text.match(/^(\s*\[[^\]]\]\s+)(.*)$/u);

  if (!checkboxMatch) {
    return undefined;
  }

  return {
    prefix: checkboxMatch[1],
    text: checkboxMatch[2],
  };
}

export function removeTimeRange(text: string) {
  const listLine = splitMarkdownListPrefix(text);
  const prefix = listLine?.prefix ?? "";
  const textWithoutPrefix = listLine?.text ?? text;

  return `${prefix}${removeTimeRangeFromStartOfLine(textWithoutPrefix)
    .trim()
    .replace(/\s+/g, " ")}`;
}

export function isTimeEqual(a: LocalTask, b: LocalTask) {
  return (
    a.startTime.isSame(b.startTime) &&
    a.durationMinutes === b.durationMinutes &&
    a.isAllDayEvent === b.isAllDayEvent
  );
}

export function hasDateFromProp(task: LocalTask) {
  return scheduledPropRegExps.some((regexp) => regexp.test(task.text));
}

export function clamp<T extends WithTime<BaseTask>>(
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

export function getBlockProps(task: Task, settings: DayPlannerSettings) {
  const result: string[] = [];

  if (settings.showTimestampInTaskBlock && isWithTime(task)) {
    const sourceStartTime =
      task.timelineSegment?.sourceStartTime ?? task.startTime;
    const sourceDurationMinutes =
      task.timelineSegment?.sourceDurationMinutes ?? task.durationMinutes;

    result.push(
      createTimestamp(
        getMinutesSinceMidnight(sourceStartTime),
        sourceDurationMinutes,
        settings.timestampFormat,
        emDash,
      ),
    );
  }

  if (isRemote(task)) {
    result.push(task.calendar.name);
  }

  return result.join(` ${bullet} `);
}

function isTimedLocalTimelineTask(task: Task): task is WithTime<LocalTask> {
  return isLocal(task) && isWithTime(task) && !task.isAllDayEvent;
}

function getSourceLine(task: LocalTask) {
  return task.location?.position.start.line;
}

type LocalTaskChild = NonNullable<LocalTask["children"]>[number];

function isSameChildSourceLine(child: LocalTaskChild, task: LocalTask) {
  return (
    child.path === task.location?.path &&
    child.position.start.line === getSourceLine(task)
  );
}

function containsTaskSourceLine(
  children: LocalTaskChild[] | undefined,
  task: LocalTask,
): boolean {
  return (
    children?.some(
      (child) =>
        isSameChildSourceLine(child, task) ||
        containsTaskSourceLine(child.children, task),
    ) ?? false
  );
}

function isNestedTimedLocalTask(
  task: Task,
  possibleParents: Task[],
): task is WithTime<LocalTask> {
  if (!isTimedLocalTimelineTask(task) || !task.location) {
    return false;
  }

  return possibleParents.some((possibleParent) => {
    if (
      possibleParent === task ||
      !isLocal(possibleParent) ||
      !possibleParent.location
    ) {
      return false;
    }

    return (
      getSourceLine(possibleParent)! < getSourceLine(task)! &&
      containsTaskSourceLine(possibleParent.children, task)
    );
  });
}

export function hideNestedTimedLocalTasks(tasks: Task[]) {
  return tasks.filter((task) => !isNestedTimedLocalTask(task, tasks));
}

export function toRenderableMarkdown(timeBlock: Node) {
  const firstLineAsMarkdown = getFirstLineAsMarkdown(timeBlock);
  const withOptionalListTokensRemoved = timeBlock.status
    ? firstLineAsMarkdown
    : removeListTokens(firstLineAsMarkdown);
  const formattedFirstLine = removeTimeRange(
    deleteProps(withOptionalListTokensRemoved),
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
