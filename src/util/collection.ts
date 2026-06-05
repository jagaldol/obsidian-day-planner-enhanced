/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Obsidian community scorecard can run type-aware rules without resolving plugin source dependencies; tsc and svelte-check cover this source. */
export function groupBy<T>(
  keyFn: (item: T) => string | number | symbol,
  items: T[],
) {
  return items.reduce<Record<string, T[]>>((result, item) => {
    const key = String(keyFn(item));
    result[key] ??= [];
    result[key].push(item);

    return result;
  }, {});
}

export function uniqBy<T>(
  keyFn: (item: T) => string | number | symbol,
  items: T[],
) {
  const seen = new Set<string | number | symbol>();

  return items.filter((item) => {
    const key = keyFn(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

export function partition<T>(
  predicate: (item: T) => boolean,
  items: T[],
): [T[], T[]] {
  return items.reduce<[T[], T[]]>(
    (result, item) => {
      result[predicate(item) ? 0 : 1].push(item);

      return result;
    },
    [[], []],
  );
}

export function takeWhile<T>(predicate: (item: T) => boolean, items: T[]) {
  const result: T[] = [];

  for (const item of items) {
    if (!predicate(item)) {
      break;
    }

    result.push(item);
  }

  return result;
}

export function chunk<T>(size: number, items: T[]) {
  if (size <= 0) {
    throw new Error("Chunk size must be positive");
  }

  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

export function range(start: number, end: number) {
  return Array.from({ length: Math.max(end - start, 0) }, (_, index) => {
    return start + index;
  });
}

export function differenceBy<T>(
  keyFn: (item: T) => string | number | symbol,
  items: T[],
  values: T[],
) {
  const valueKeys = new Set(values.map(keyFn));

  return items.filter((item) => !valueKeys.has(keyFn(item)));
}

export function omitKeys<T extends Record<string, unknown>, K extends keyof T>(
  keys: readonly K[],
  object: T,
): Omit<T, K> {
  const keysToOmit = new Set<string>(keys.map(String));

  return Object.fromEntries(
    Object.entries(object).filter(([key]) => !keysToOmit.has(key)),
  ) as Omit<T, K>;
}

export function areArraysEqual<T>(a: T[], b: T[]) {
  return (
    a.length === b.length && a.every((item, index) => Object.is(item, b[index]))
  );
}
/* eslint-enable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-enum-comparison, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Re-enable scorecard compatibility suppressions after this file. */
