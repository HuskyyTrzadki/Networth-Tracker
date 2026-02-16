"use client";

import type { UseFormReturn } from "react-hook-form";

import type { FormValues } from "../AddTransactionDialogContent";
import { AddTransactionNotesSummary } from "./AddTransactionNotesSummary";
import type { TransactionType } from "../../lib/add-transaction-form-schema";

type Props = Readonly<{
  form: UseFormReturn<FormValues>;
  displayCurrency: string;
  fee: string;
  price: string;
  quantity: string;
  type: TransactionType;
}>;

export function AddTransactionSidebarSummary({
  form,
  displayCurrency,
  fee,
  price,
  quantity,
  type,
}: Props) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
      <section className="rounded-lg border border-border/70 bg-background p-4">
        <AddTransactionNotesSummary
          displayCurrency={displayCurrency}
          fee={fee}
          form={form}
          price={price}
          quantity={quantity}
          type={type}
        />
      </section>
    </aside>
  );
}
