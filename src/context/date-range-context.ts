import { getContext } from "svelte";
import type { Writable } from "svelte/store";

import { dateRangeContextKey } from "../constants";
import type { Moment } from "../util/obsidian-moment";

export function getDateRangeContext() {
  return getContext<Writable<Moment[]>>(dateRangeContextKey);
}
