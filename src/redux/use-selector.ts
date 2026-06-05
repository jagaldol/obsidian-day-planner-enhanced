/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware unsafe rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
import type { Store } from "@reduxjs/toolkit";
import { createSubscriber } from "svelte/reactivity";

export function createUseSelector<StateType>(reduxStore: Store<StateType>) {
  return <SelectorReturnType>(
    selector: (state: StateType) => SelectorReturnType,
  ) => {
    let previousResult: SelectorReturnType;

    const subscribe = createSubscriber((update) => {
      const unsubscribeFromReduxStore = reduxStore.subscribe(() => {
        const nextResult = selector(reduxStore.getState());

        if (previousResult !== nextResult) {
          previousResult = nextResult;

          update();
        }
      });

      return unsubscribeFromReduxStore;
    });

    return {
      get current() {
        subscribe();

        const nextResult = selector(reduxStore.getState());
        previousResult = nextResult;

        return nextResult;
      },
    };
  };
}

export type UseSelector<StateType> = ReturnType<
  typeof createUseSelector<StateType>
>;
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
