/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { Action } from "@reduxjs/toolkit";
import { readable } from "svelte/store";

import type { AppListenerMiddlewareInstance } from "./store";

export function useActionDispatched(props: {
  listenerMiddleware: AppListenerMiddlewareInstance;
}) {
  const { listenerMiddleware } = props;

  return readable<Action>(undefined, (set) => {
    return listenerMiddleware.startListening({
      predicate: () => true,
      effect: (action) => {
        set(action);
      },
    });
  });
}
