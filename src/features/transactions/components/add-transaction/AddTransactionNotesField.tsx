"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/design-system/components/ui/form";
import { Textarea } from "@/features/design-system/components/ui/textarea";

import type { FormValues } from "../AddTransactionDialogContent";
import type { UseFormReturn } from "react-hook-form";

export function AddTransactionNotesField({
  form,
  variant = "default",
}: Readonly<{
  form: UseFormReturn<FormValues>;
  variant?: "default" | "custom";
}>) {
  const fieldLabelClass =
    "text-[11px] uppercase tracking-[0.14em] text-muted-foreground/95";
  const label = variant === "custom" ? "Opis" : "Notatka";
  const placeholder =
    variant === "custom"
      ? "Adres, miasto, metraż, standard, okolica. Wszystko, co pomoże później wycenić aktywo."
      : "Krótko: dlaczego kupujesz albo sprzedajesz? Np. po wynikach, pod dywidendę, po wybiciu.";

  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel className={fieldLabelClass}>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              className="min-h-24 resize-none border-border/65 bg-background/92 leading-relaxed"
              placeholder={placeholder}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
