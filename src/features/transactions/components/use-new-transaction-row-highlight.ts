import { useEffect, useRef, useState } from "react";

export function useNewTransactionRowHighlight<TRow extends Readonly<{ rowKey: string }>>(
  rows: readonly TRow[],
  durationMs = 500
): ReadonlySet<string> {
  const previousRowKeysRef = useRef<ReadonlySet<string>>(new Set());
  const [newRowKeys, setNewRowKeys] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const nextKeys = new Set(rows.map((row) => row.rowKey));
    if (previousRowKeysRef.current.size === 0) {
      previousRowKeysRef.current = nextKeys;
      return;
    }

    const added = rows
      .map((row) => row.rowKey)
      .filter((rowKey) => !previousRowKeysRef.current.has(rowKey));

    previousRowKeysRef.current = nextKeys;

    if (added.length === 0) {
      return;
    }

    setNewRowKeys(new Set(added));

    const timeout = window.setTimeout(() => {
      setNewRowKeys(new Set());
    }, durationMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [durationMs, rows]);

  return newRowKeys;
}
