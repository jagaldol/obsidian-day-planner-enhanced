/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import { timeRegExp } from "../regexp";
import type { Moment } from "../util/obsidian-moment";

export function parseTime(asText: string, day: Moment) {
  const match = asText.match(timeRegExp);

  if (match === null) {
    throw new Error(`${asText} is not a valid timestamp`);
  }

  const [, hours12h, minutes12h, ampm, hours24h, minutes24h] = match;

  const hours = hours12h ?? hours24h;
  const minutes = minutes12h ?? minutes24h;

  let parsedHours = parseInt(hours, 10);

  if (Number.isNaN(parsedHours)) {
    throw new Error(`${asText} is not a valid timestamp`);
  }

  const parsedMinutes = parseInt(minutes, 10) || 0;

  const ampmNormalized = ampm?.toLowerCase().trim();

  if (ampmNormalized && (parsedHours < 1 || parsedHours > 12)) {
    throw new Error(`${asText} is not a valid timestamp`);
  }

  if (
    !ampmNormalized &&
    (parsedHours > 24 || (parsedHours === 24 && parsedMinutes !== 0))
  ) {
    throw new Error(`${asText} is not a valid timestamp`);
  }

  if (ampmNormalized === "pm" && parsedHours < 12) {
    parsedHours += 12;
  } else if (ampmNormalized === "am" && parsedHours === 12) {
    parsedHours = 0;
  }

  const timeOfDay = window.moment.duration({
    hours: parsedHours,
    minutes: parsedMinutes,
  });

  return day.clone().startOf("day").add(timeOfDay);
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
