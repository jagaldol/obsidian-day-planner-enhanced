import { RRule, type Options } from "rrule";

import { obsidianBlockIdRegExp } from "../regexp";
import type { PlanTimeBlock } from "../time-block-types";

import type { Moment } from "./obsidian-moment";
import { removeTasksMetadata, removeTimeRange } from "./time-block-utils";

export interface RecurringPreview {
  source: PlanTimeBlock;
  id: string;
  occurrenceDay: string;
  title: string;
  startTime: Moment;
  durationMinutes: number;
  isAllDay: boolean;
}

export interface RecurringSource {
  block: PlanTimeBlock;
  title: string;
  seriesKey: string;
  recurrenceKey: string;
  reference: Moment;
  scheduledOffset: number;
  endHour: number;
  endMinute: number;
  endDayOffset: number;
  options: Partial<Options>;
  calendarStep?: { unit: "months" | "years"; interval: number };
}

export function getRecurringTaskDate(
  text: string,
  emoji: string,
  field: string,
) {
  const match = text.match(
    new RegExp(
      `(?:${emoji}\\s*|[[(]\\s*${field}\\s*::\\s*)(\\d{4}-\\d{2}-\\d{2})`,
      "i",
    ),
  );
  if (!match?.[1]) return undefined;
  const date = window.moment.utc(match[1], "YYYY-MM-DD", true);
  return date.isValid() ? date : undefined;
}

/** Match Tasks' date priority, using floating UTC dates for calendar arithmetic. */
export function prepareRecurringSource(
  block: PlanTimeBlock,
): RecurringSource | undefined {
  if (
    block.task === undefined ||
    (!block.isAllDayEvent &&
      (block.durationMinutes <= 0 || block.durationMinutes > 1440))
  )
    return undefined;
  const text = block.text.split("\n")[0] ?? "";
  const ruleText = (
    text.match(/🔁\s*([a-z\d, !]+)/i)?.[1] ??
    text.match(/[[(]\s*(?:repeat|recurrence)\s*::\s*([^\])]+)/i)?.[1]
  )?.trim();
  if (!ruleText || ruleText.length > 256 || /when done/i.test(ruleText))
    return undefined;
  const scheduled =
    getRecurringTaskDate(text, "⏳", "scheduled") ??
    window.moment.utc(block.startTime.format("YYYY-MM-DD"));
  const reference = getRecurringTaskDate(text, "📅", "due") ?? scheduled;
  try {
    const parsed = RRule.parseText(ruleText);
    // Count-based rules depend on completion history. Sub-daily rules are not task-date recurrences.
    if (
      parsed.freq === undefined ||
      parsed.freq > RRule.DAILY ||
      parsed.count ||
      !Number.isSafeInteger(parsed.interval ?? 1) ||
      (parsed.interval ?? 1) < 1 ||
      (parsed.interval ?? 1) > 10000
    )
      return undefined;
    const rule = new RRule({ ...parsed, dtstart: reference.toDate() }, true);
    const options: Partial<Options> = { ...parsed };
    // Preserve defaults when moving dtstart close to the requested day. Never iterate from an ancient task date.
    if (parsed.freq === RRule.WEEKLY && parsed.byweekday === undefined)
      options.byweekday = rule.options.byweekday;
    if (
      parsed.freq <= RRule.MONTHLY &&
      parsed.bymonthday === undefined &&
      parsed.byweekday === undefined
    )
      options.bymonthday = rule.options.bymonthday;
    if (parsed.freq === RRule.YEARLY && parsed.bymonth === undefined)
      options.bymonth = rule.options.bymonth;
    const simpleCalendar = ruleText.match(/^every(?: (\d+))? (month|year)s?$/i);
    const title = removeTimeRange(
      removeTasksMetadata(text.replace(obsidianBlockIdRegExp, "")),
    ).trim();
    const scheduledOffset = scheduled.diff(reference, "days");
    const end = block.startTime.clone().add(block.durationMinutes, "minutes");
    const endDayOffset = end
      .clone()
      .startOf("day")
      .diff(block.startTime.clone().startOf("day"), "days");
    return {
      block,
      title,
      reference,
      scheduledOffset,
      endHour: end.hour(),
      endMinute: end.minute(),
      endDayOffset,
      options,
      seriesKey: JSON.stringify([
        block.path,
        title,
        rule.toText(),
        block.isAllDayEvent ? "all-day" : "timed",
        block.isAllDayEvent ? null : block.startTime.format("HH:mm"),
        block.isAllDayEvent ? null : end.format("HH:mm"),
        block.isAllDayEvent ? null : endDayOffset,
        scheduledOffset,
      ]),
      recurrenceKey: JSON.stringify([
        reference.format("YYYY-MM-DD"),
        rule.toText(),
      ]),
      calendarStep: simpleCalendar
        ? {
            unit:
              simpleCalendar[2]?.toLowerCase() === "month" ? "months" : "years",
            interval: Number(simpleCalendar[1] ?? 1),
          }
        : undefined,
    };
  } catch {
    // Invalid or partially typed recurrence rules must not break the planner.
    return undefined;
  }
}

function matchesCalendarStep(source: RecurringSource, target: Moment) {
  const step = source.calendarStep!;
  const difference =
    step.unit === "months"
      ? (target.year() - source.reference.year()) * 12 +
        target.month() -
        source.reference.month()
      : target.year() - source.reference.year();
  if (difference <= 0 || difference % step.interval !== 0) return false;
  const count = difference / step.interval;
  // Tasks clamps implicit month/year recurrences (Jan 31 -> Feb 28 -> Mar 28).
  // The Gregorian calendar repeats every 400 years, so even distant dates have bounded cost.
  let day = source.reference.date();
  const cycle = step.unit === "months" ? 4800 : 400;
  for (let i = 1; i <= Math.min(count, cycle) && day > 28; i++) {
    day = Math.min(
      day,
      source.reference
        .clone()
        .date(1)
        .add(i * step.interval, step.unit)
        .daysInMonth(),
    );
  }
  return source.reference
    .clone()
    .date(1)
    .add(difference, step.unit)
    .date(day)
    .isSame(target, "day");
}

function matchesReferenceDay(source: RecurringSource, target: Moment) {
  if (!target.isAfter(source.reference, "day")) return false;
  if (source.calendarStep) return matchesCalendarStep(source, target);
  const { options, reference } = source;
  const interval = options.interval ?? 1;
  let start: Moment;
  switch (options.freq) {
    case RRule.YEARLY: {
      const periods = Math.floor((target.year() - reference.year()) / interval);
      start = reference
        .clone()
        .startOf("year")
        .add(periods * interval, "years");
      break;
    }
    case RRule.MONTHLY: {
      const months =
        (target.year() - reference.year()) * 12 +
        target.month() -
        reference.month();
      start = reference
        .clone()
        .startOf("month")
        .add(Math.floor(months / interval) * interval, "months");
      break;
    }
    case RRule.WEEKLY: {
      const week = reference.clone().startOf("isoWeek");
      start = week.add(
        Math.floor(target.diff(week, "days") / (7 * interval)) * 7 * interval,
        "days",
      );
      break;
    }
    default:
      start = reference
        .clone()
        .add(
          Math.floor(target.diff(reference, "days") / interval) * interval,
          "days",
        );
  }
  if (start.isBefore(reference)) start = reference.clone();
  const rule = new RRule({ ...options, dtstart: start.toDate() }, true);
  return (
    rule.between(target.toDate(), target.clone().endOf("day").toDate(), true)
      .length > 0
  );
}

/** Only test the requested date (and the previous date for overnight tasks). */
export function getRecurringPreviewForDay(
  source: RecurringSource,
  dayKey: string,
  matches = new Map<string, boolean>(),
): RecurringPreview[] {
  const day = window.moment(dayKey, "YYYY-MM-DD", true);
  if (!day.isValid()) return [];
  const result: RecurringPreview[] = [];
  const endOfDay = day.clone().add(1, "day");
  const isAllDay = source.block.isAllDayEvent === true;
  const crossesMidnight = !isAllDay && source.endDayOffset > 0;
  for (const offset of crossesMidnight ? [-1, 0] : [0]) {
    const occurrenceDay = day.clone().add(offset, "days");
    const referenceDay = window.moment
      .utc(occurrenceDay.format("YYYY-MM-DD"))
      .subtract(source.scheduledOffset, "days");
    const matchKey = `${source.recurrenceKey}:${referenceDay.format("YYYY-MM-DD")}`;
    let occurs = matches.get(matchKey);
    if (occurs === undefined) {
      occurs = matchesReferenceDay(source, referenceDay);
      matches.set(matchKey, occurs);
    }
    if (!occurs) continue;
    if (isAllDay) {
      result.push({
        source: source.block,
        id: `${source.block.id}:recurring:${dayKey}`,
        occurrenceDay: dayKey,
        title: source.title,
        startTime: day.clone(),
        durationMinutes: endOfDay.diff(day, "minutes"),
        isAllDay: true,
      });
      continue;
    }
    const start = occurrenceDay
      .clone()
      .hour(source.block.startTime.hour())
      .minute(source.block.startTime.minute());
    // Keep both clock times, even when this occurrence crosses a DST transition.
    const end = occurrenceDay
      .clone()
      .add(source.endDayOffset, "days")
      .hour(source.endHour)
      .minute(source.endMinute);
    if (!end.isAfter(day) || !start.isBefore(endOfDay)) continue;
    const visibleStart = start.isBefore(day) ? day.clone() : start;
    const visibleEnd = end.isAfter(endOfDay) ? endOfDay : end;
    result.push({
      source: source.block,
      id: `${source.block.id}:recurring:${occurrenceDay.format("YYYY-MM-DD")}:${dayKey}`,
      occurrenceDay: occurrenceDay.format("YYYY-MM-DD"),
      title: source.title,
      startTime: visibleStart,
      durationMinutes: visibleEnd.diff(visibleStart, "minutes"),
      isAllDay: false,
    });
  }
  return result;
}
