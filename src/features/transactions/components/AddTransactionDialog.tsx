"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/design-system/components/ui/form";
import { Input } from "@/features/design-system/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/features/design-system/components/ui/tabs";
import { Textarea } from "@/features/design-system/components/ui/textarea";

import {
  createAddTransactionFormSchema,
  type TransactionType,
} from "../lib/add-transaction-form-schema";
import type { InstrumentSearchResult } from "../lib/instrument-search";
import { InstrumentCombobox } from "./InstrumentCombobox";
import { MoneyInput } from "./MoneyInput";
import { TransactionDatePicker } from "./TransactionDatePicker";
import { TransactionLiveSummary } from "./TransactionLiveSummary";
import { createTransaction } from "../client/create-transaction";
import type { InstrumentSearchClient } from "../client/search-instruments";

type FormValues = Readonly<{
  type: TransactionType;
  assetId: string;
  currency: string;
  date: string;
  quantity: string;
  price: string;
  fee: string;
  notes: string;
}>;

export function AddTransactionDialog({
  initialValues,
  initialInstrument,
  searchClient,
  portfolioId,
  open,
  onOpenChange,
}: Readonly<{
  initialValues?: Partial<FormValues>;
  initialInstrument?: InstrumentSearchResult;
  searchClient?: InstrumentSearchClient;
  portfolioId: string;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}>) {
  const schema = createAddTransactionFormSchema();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInstrument, setSelectedInstrument] =
    useState<InstrumentSearchResult | null>(initialInstrument ?? null);

  const initialAssetId = initialInstrument?.id ?? "";
  const initialCurrency = initialInstrument?.currency ?? "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "BUY",
      assetId: initialAssetId,
      currency: initialCurrency,
      date: format(new Date(), "yyyy-MM-dd"),
      quantity: "",
      price: "",
      fee: "",
      notes: "",
      ...initialValues,
    },
    mode: "onChange",
  });

  const assetId = useWatch({ control: form.control, name: "assetId" });
  const currency = useWatch({ control: form.control, name: "currency" });
  const date = useWatch({ control: form.control, name: "date" });
  const type = useWatch({ control: form.control, name: "type" });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const price = useWatch({ control: form.control, name: "price" });
  const fee = useWatch({ control: form.control, name: "fee" });
  const notes = useWatch({ control: form.control, name: "notes" });

  const displayCurrency = selectedInstrument?.currency ?? currency ?? "";

  const isSubmittable =
    Boolean(selectedInstrument) &&
    schema.safeParse({
      type,
      assetId,
      currency,
      date,
      quantity,
      price,
      fee,
      notes,
    }).success;

  const submitTransaction = form.handleSubmit(async (values) => {
    if (!selectedInstrument) {
      form.setError("assetId", { message: "Wybierz instrument." });
      return;
    }

    setIsSubmitting(true);
    form.clearErrors("root");

    try {
      await createTransaction({
        type: values.type,
        date: values.date,
        quantity: values.quantity,
        price: values.price,
        fee: values.fee,
        notes: values.notes,
        portfolioId,
        clientRequestId: crypto.randomUUID(),
        instrument: {
          provider: selectedInstrument.provider,
          providerKey: selectedInstrument.providerKey,
          symbol: selectedInstrument.symbol,
          name: selectedInstrument.name,
          currency: selectedInstrument.currency,
          exchange: selectedInstrument.exchange,
          region: selectedInstrument.region,
          logoUrl: selectedInstrument.logoUrl,
        },
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się zapisać transakcji.";
      form.setError("root", { message });
    } finally {
      setIsSubmitting(false);
    }
  });

  const rootError = form.formState.errors.root?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] p-0 sm:max-w-xl">
        <Form {...form}>
          <form
            className="flex max-h-[90dvh] flex-col"
            onSubmit={submitTransaction}
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div className="min-w-0">
                <DialogTitle className="truncate">Dodaj transakcję</DialogTitle>
                <DialogDescription className="mt-1">
                  Wprowadź szczegóły transakcji.
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button
                  aria-label="Zamknij"
                  className="h-9 w-9 p-0"
                  type="button"
                  variant="ghost"
                >
                  <X className="size-5 opacity-70" aria-hidden />
                </Button>
              </DialogClose>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ transakcji</FormLabel>
                      <FormControl>
                        <Tabs
                          onValueChange={(next) =>
                            field.onChange(next as TransactionType)
                          }
                          value={field.value}
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger className="w-full" value="BUY">
                              Kupno
                            </TabsTrigger>
                            <TabsTrigger className="w-full" value="SELL">
                              Sprzedaż
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrument</FormLabel>
                      <FormControl>
                        <InstrumentCombobox
                          onChange={(instrument) => {
                            setSelectedInstrument(instrument);
                            field.onChange(instrument.id);
                            form.setValue("currency", instrument.currency, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          searchClient={searchClient}
                          value={selectedInstrument}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ilość</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-11 font-mono tabular-nums text-right"
                            inputMode="decimal"
                            placeholder="np. 1,5"
                            type="text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cena jednostkowa</FormLabel>
                        <FormControl>
                          <MoneyInput
                            {...field}
                            className="h-11"
                            currency={displayCurrency}
                            placeholder="np. 100,00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data transakcji</FormLabel>
                        <FormControl>
                          <TransactionDatePicker
                            onChange={field.onChange}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prowizja / opłaty</FormLabel>
                        <FormControl>
                          <MoneyInput
                            {...field}
                            className="h-11"
                            currency={displayCurrency}
                            placeholder="np. 0,00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
              </div>
            </div>

            <footer className="border-t border-border px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-5 text-sm text-destructive">
                  {rootError ?? ""}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    onClick={() => onOpenChange(false)}
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Anuluj
                  </Button>
                  <Button
                    disabled={!isSubmittable || isSubmitting}
                    type="submit"
                  >
                    Zapisz
                  </Button>
                </div>
              </div>
            </footer>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
