export function dedupeRowsByKey<T>(
  rows: readonly T[],
  getKey: (row: T) => string
): T[] {
  const deduped = new Map<string, T>();

  rows.forEach((row) => {
    deduped.set(getKey(row), row);
  });

  return Array.from(deduped.values());
}
