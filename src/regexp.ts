const ulToken = `[-*+]`;
const olToken = `\\d+[.)]`;
const listToken = `(${ulToken}|${olToken})`;
const listTokenWithSpaces = `^\\s*${listToken}\\s+`;

const checkbox = `\\s*\\[(?<completion>[^\\]])]\\s+`;

const hours12h = "[0-1]?\\d";
const hours24h = "[0-2]?\\d";
const minutes = "[0-5]\\d";
const hourMinuteSeparator = "[:.]";
const ampm = "\\s?[apAP][mM](?!\\w)";

const time12h = `(${hours12h})(?:${hourMinuteSeparator}?(${minutes}))(${ampm})`;
const time24h = `(${hours24h})(?:${hourMinuteSeparator}?(${minutes}))`;
const separatedTime24h = `(${hours24h})(?:${hourMinuteSeparator}(${minutes}))`;
const time = `(?:${time12h}|${time24h})(?!\\d)`;
const separatedTime = `(?:${time12h}|${separatedTime24h})(?!\\d)`;
const compactTime = `(?:[0-2]\\d${minutes})(?!\\d)`;

const timeRangeSeparator = `\\s?-\\s?`;

function createTimestampRegExps(timestampFormat: string) {
  const acceptsCompact = timestampFormat === "HHmm";
  const rangeEnd = acceptsCompact
    ? `(?:${separatedTime}|${compactTime})`
    : separatedTime;
  const rangeStart = acceptsCompact
    ? `(?:${separatedTime}|${compactTime}(?=${timeRangeSeparator}${rangeEnd}))`
    : separatedTime;
  const timeRange = `(?<start>${rangeStart})(?:${timeRangeSeparator}(?<end>${rangeEnd}))?`;

  return {
    timeRange: new RegExp(timeRange, "im"),
    timeRangeAtStartOfLine: new RegExp(`^${timeRange}`, "im"),
  };
}

const initialTimestampRegExps = createTimestampRegExps("HH:mm");

export const timeRegExp = new RegExp(`^${time}$`);
export let timeRangeRegExp = initialTimestampRegExps.timeRange;
export let timeRangeAtStartOfLineRegExp =
  initialTimestampRegExps.timeRangeAtStartOfLine;

export function configureTimestampRegExps(timestampFormat: string) {
  const next = createTimestampRegExps(timestampFormat);

  timeRangeRegExp = next.timeRange;
  timeRangeAtStartOfLineRegExp = next.timeRangeAtStartOfLine;
}

const datePattern = "\\d{4}-\\d{2}-\\d{2}";

export const listTokenWithSpacesRegExp = new RegExp(listTokenWithSpaces);
export const checkboxRegExp = new RegExp(checkbox);

export const headingRegExp = /^(#+)\s/;
export const obsidianBlockIdRegExp = /\s\^[a-z1-9-]+$/i;
export const listItemRegExp = new RegExp(
  "^[\\s>]*(?<symbol>\\d+\\.|\\d+\\)|\\*|-|\\+)\\s*(?:\\[(?<task>.)\\])?\\s*(?<text>.*)$",
  "mu",
);

export const scheduledPropRegExp = new RegExp(
  `(\\[scheduled\\s*::\\s*)(?<date>${datePattern})(])`,
);

export const keylessScheduledPropRegExp = new RegExp(
  `(\\(scheduled\\s*::\\s*)(?<date>${datePattern})(\\))`,
);

export const hourglass = "⏳";

export const shortScheduledPropRegExp = new RegExp(
  `(${hourglass}\\s*)(?<date>${datePattern})`,
);

export const scheduledPropRegExps = [
  scheduledPropRegExp,
  keylessScheduledPropRegExp,
  shortScheduledPropRegExp,
];

export const propRegexp = /\[([^\]]+)::([^\]]+)]/g;

export const escapedSquareBracket = /\\\[/g;
