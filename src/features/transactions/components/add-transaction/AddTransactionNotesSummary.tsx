"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/design-system/components/ui/form";
import { Textarea } from "@/features/design-system/components/ui/textarea";

import { TransactionLiveSummary } from "../TransactionLiveSummary";
import type { FormValues } from "../AddTransactionDialogContent";
import type { UseFormReturn } from "react-hook-form";
import type { TransactionType } from "../../lib/add-transaction-form-schema";

export function AddTransactionNotesSummary({
  form,
  displayCurrency,
  fee,
  price,
  quantity,
  type,
}: Readonly<{
  form: UseFormReturn<FormValues>;
  displayCurrency: string;
  fee: string;
  price: string;
  quantity: string;
  type: TransactionType;
}>) {
  return (
    <>
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notatka</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-24 resize-none"
                placeholder="Dlaczego to kupiłem? (np. Spadło o 10% po wynikach)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <TransactionLiveSummary
        currency={displayCurrency}
        fee={fee}
        price={price}
        quantity={quantity}
        type={type}
      />
    </>
  );
}
