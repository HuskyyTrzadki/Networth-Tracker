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
    "text-[11px] uppercase tracking-[0.14em] text-muted-foreground";
  const label = variant === "custom" ? "Opis" : "Notatka";
  const placeholder =
    variant === "custom"
      ? "Adres/miasto, metraz, standard, okolica, wszystko co pomoze wycenic…"
      : "Dlaczego to kupiłem? (np. Spadło o 10% po wynikach)";

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
              className="min-h-20 resize-none"
              placeholder={placeholder}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
