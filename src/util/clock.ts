import { clockFormat } from "../constants";
import type { Moment } from "../util/obsidian-moment";

export type ClockMoments = [Moment, Moment];

export function createClockTimestamp() {
  return window.moment().format(clockFormat);
}
