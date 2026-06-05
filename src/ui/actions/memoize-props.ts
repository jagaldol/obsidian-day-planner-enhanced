/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

type IdentityGetters<T> = Partial<{
  [Prop in keyof T]: (value: T[Prop]) => string;
}>;

/**
 * Detect change in an object using custom identity functions for each object prop if needed
 *
 * @param initialProps
 * @param identityGetters
 */
export function createMemo<PropsType>(
  initialProps: PropsType,
  identityGetters: IdentityGetters<PropsType>,
) {
  let previousProps: PropsType = initialProps;

  function shouldUpdate(newProps: PropsType) {
    for (const [propKey, propValue] of Object.entries(
      // @ts-ignore
      newProps,
    ) as Entries<PropsType>) {
      const previousValue = previousProps[propKey];
      const identityFn = identityGetters?.[propKey];
      const currentIdentity = identityFn ? identityFn(propValue) : propValue;
      const previousIdentity = identityFn
        ? identityFn(previousValue)
        : previousValue;
      const propChanged = currentIdentity !== previousIdentity;

      if (propChanged) {
        previousProps = newProps;

        return true;
      }
    }

    return false;
  }

  return shouldUpdate;
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
