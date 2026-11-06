import type { Nodes } from "mdast";

import { fromMarkdown } from "../mdast/mdast";
import { getTimeFromLine } from "../parser/parser";

import {
  getRecurringPreviewForDay,
  getRecurringTaskDate,
  prepareRecurringSource,
  type RecurringPreview,
} from "./recurring-preview";

const taskLine = /^([\s>]*(?:[-*+]|\d+[.)])\s+)\[(.)\]\s+(.*)$/;

/** Copy only the task line, without completion history, logs or unique identifiers. */
function withoutHistory(text: string) {
  return text
    .replace(/\s*[✅❌]\s*\d{4}-\d{2}-\d{2}/gu, "")
    .replace(/\s*🆔\s*[^\s]+/gu, "")
    .replace(/\s*[[(]\s*(?:completion|cancelled|id|log)\s*::[^\])]*[\])]/gi, "")
    .replace(/\s+\^[\w-]+\s*$/, "")
    .trim();
}

/** Runs inside Vault.process, so confirmation delays and repeated clicks cannot overwrite other edits. */
export function insertRecurringOccurrence(
  contents: string,
  preview: RecurringPreview,
  today: string,
): string {
  const { source, occurrenceDay } = preview;
  const prepared = prepareRecurringSource(source);
  if (
    !prepared ||
    occurrenceDay < today ||
    !getRecurringPreviewForDay(prepared, occurrenceDay).some(
      (item) => item.occurrenceDay === occurrenceDay,
    )
  )
    throw new Error(
      "This preview is no longer available. Refresh the planner and try again.",
    );

  const newline = contents.includes("\r\n") ? "\r\n" : "\n";
  const lines = contents.split(newline);
  const taskLines = new Set<number>();
  function visit(node: Nodes) {
    if (node.type === "listItem" && node.position) {
      taskLines.add(node.position.start.line - 1);
    }
    if ("children" in node) node.children.forEach(visit);
  }
  visit(fromMarkdown(contents));
  const expectedText = source.text.split("\n")[0]?.trim();
  const matchesSource = (line: string) => {
    const match = line.match(taskLine);
    return match?.[2] === source.task && match?.[3]?.trim() === expectedText;
  };
  let sourceIndex = source.position.start.line;
  if (!taskLines.has(sourceIndex) || !matchesSource(lines[sourceIndex] ?? "")) {
    const matches = [...taskLines].filter((index) =>
      matchesSource(lines[index] ?? ""),
    );
    if (matches.length !== 1)
      throw new Error(
        "The original task changed or was removed. Refresh the planner and try again.",
      );
    sourceIndex = matches[0]!;
  }
  const original = lines[sourceIndex]!.match(taskLine)!;

  // Check the current file, including changes that have not reached the index yet.
  for (const index of taskLines) {
    const line = lines[index]!;
    const match = line.match(taskLine);
    if (!match) continue;
    const text = match[3]!;
    const date = getRecurringTaskDate(text, "⏳", "scheduled");
    if (date?.format("YYYY-MM-DD") !== occurrenceDay) continue;
    const day = window.moment(occurrenceDay);
    const time = getTimeFromLine({ line: text, day });
    const candidate = prepareRecurringSource({
      ...source,
      text,
      task: match[2],
      startTime: time?.startTime ?? day,
      durationMinutes: time?.durationMinutes ?? source.durationMinutes,
      isAllDayEvent: !time,
    });
    if (candidate?.seriesKey === prepared.seriesKey) {
      throw new Error("A matching occurrence already exists in this note.");
    }
  }

  const offset = window.moment
    .utc(occurrenceDay)
    .diff(window.moment.utc(source.startTime.format("YYYY-MM-DD")), "days");
  let text = withoutHistory(original[3]!)
    .replace(
      /((?:⏳|📅|🛫)\s*|[[(]\s*(?:scheduled|due|start)\s*::\s*)(\d{4}-\d{2}-\d{2})/giu,
      (_match, prefix: string, date: string) =>
        prefix +
        window.moment.utc(date).add(offset, "days").format("YYYY-MM-DD"),
    )
    .replace(
      /(➕\s*|[[(]\s*created\s*::\s*)\d{4}-\d{2}-\d{2}/giu,
      (_match, prefix: string) => prefix + today,
    );
  if (!getRecurringTaskDate(text, "⏳", "scheduled")) {
    const inline = /[[(]\s*(?:repeat|recurrence)\s*::/i.test(text);
    text += inline ? ` [scheduled:: ${occurrenceDay}]` : ` ⏳ ${occurrenceDay}`;
  }
  // Insert before the original so its nested content stays attached to it.
  lines.splice(sourceIndex, 0, `${original[1]}[ ] ${text}`);
  return lines.join(newline);
}
