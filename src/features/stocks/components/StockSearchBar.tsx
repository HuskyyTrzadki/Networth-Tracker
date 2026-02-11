"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { InstrumentCombobox } from "@/features/transactions/components/InstrumentCombobox";
import type { InstrumentSearchResult } from "@/features/transactions/lib/instrument-search";

export function StockSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState<InstrumentSearchResult | null>(null);

  return (
    <InstrumentCombobox
      value={value}
      allowedTypes={["EQUITY"]}
      emptyLabel="Szukaj akcji po nazwie lub tickerze"
      queryPlaceholder="Szukaj (np. AAPL, MSFT, CDR)"
      triggerClassName="h-12 rounded-xl bg-background/90"
      onChange={(next) => {
        setValue(next);
        router.push(`/stocks/${encodeURIComponent(next.providerKey)}`);
      }}
    />
  );
}
