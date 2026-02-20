"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { Badge } from "@/features/design-system/components/ui/badge";

import type { FormValues } from "../AddTransactionDialogContent";
import { TransactionLiveSummary } from "../TransactionLiveSummary";
import type { TransactionType } from "../../lib/add-transaction-form-schema";
import type { InstrumentSearchResult } from "../../lib/instrument-search";
import {
  customAssetTypeLabels,
  DEFAULT_CUSTOM_ASSET_TYPE,
} from "../../lib/custom-asset-types";

type Props = Readonly<{
  form: UseFormReturn<FormValues>;
  displayCurrency: string;
  fee: string;
  price: string;
  quantity: string;
  type: TransactionType;
  isCustomTab: boolean;
  selectedInstrument: InstrumentSearchResult | null;
}>;

export function AddTransactionSidebarSummary({
  form,
  displayCurrency,
  fee,
  price,
  quantity,
  type,
  isCustomTab,
  selectedInstrument,
}: Props) {
  const customName = useWatch({ control: form.control, name: "customName" });
  const customAssetType = useWatch({
    control: form.control,
    name: "customAssetType",
  });

  const headline = isCustomTab
    ? customName?.trim() ||
      customAssetTypeLabels[customAssetType ?? DEFAULT_CUSTOM_ASSET_TYPE] ||
      "Aktywo nierynkowe"
    : selectedInstrument?.symbol || "Wybierz instrument";
  const subheadline = isCustomTab
    ? "Aktywo nierynkowe"
    : selectedInstrument?.name || "Pozycja rynkowa";

  return (
    <aside className="space-y-3 lg:sticky lg:top-3 lg:self-start">
      <section className="rounded-lg border border-border/70 bg-background/95 p-3.5 shadow-[var(--shadow-soft)]">
        <div className="mb-3 space-y-2 border-b border-border/70 pb-2.5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Skutek finansowy
          </p>
          <div className="space-y-1">
            <p
              className={`truncate text-sm font-medium ${
                isCustomTab ? "text-foreground" : "font-mono tabular-nums tracking-tight text-foreground"
              }`}
            >
              {headline}
            </p>
            <p className="truncate text-xs text-muted-foreground">{subheadline}</p>
          </div>
          <Badge className="w-fit rounded-sm border border-current/55 bg-transparent text-[10px] uppercase tracking-[0.16em] text-foreground/70">
            {type === "BUY" ? "Kupno" : "Sprzedaż"}
          </Badge>
        </div>

        <TransactionLiveSummary
          currency={displayCurrency}
          fee={fee}
          price={price}
          quantity={quantity}
          type={type}
        />
      </section>
    </aside>
  );
}
