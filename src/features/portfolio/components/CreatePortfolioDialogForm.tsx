"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/features/design-system/components/ui/button";
import { DialogDescription, DialogTitle } from "@/features/design-system/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/design-system/components/ui/form";
import { Input } from "@/features/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";
import { Switch } from "@/features/design-system/components/ui/switch";
import { createPortfolioAction } from "@/features/portfolio/server/create-portfolio-action";

import {
  createPortfolioSchema,
  type CreatePortfolioInput,
} from "../lib/create-portfolio-schema";
import { portfolioBaseCurrencies } from "../lib/base-currency";

type Props = Readonly<{
  onCancel: () => void;
  onCreated: (createdPortfolioId: string) => void;
  createPortfolioFn?: (input: CreatePortfolioInput) => Promise<{ id: string }>;
}>;

export function CreatePortfolioDialogForm({ onCancel, onCreated, createPortfolioFn }: Props) {
  const [isSubmitting, startSubmitTransition] = useTransition();

  const form = useForm<CreatePortfolioInput>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      name: "",
      baseCurrency: portfolioBaseCurrencies[0],
      isTaxAdvantaged: false,
    },
    mode: "onChange",
  });

  const submitPortfolio = form.handleSubmit(async (values) => {
    form.clearErrors("root");

    startSubmitTransition(() => {
      const create = createPortfolioFn ?? createPortfolioAction;
      void create(values)
        .then((created) => {
          onCreated(created.id);
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : "Nie udało się utworzyć portfela.";
          form.setError("root", { message });
        });
    });
  });

  const rootError = form.formState.errors.root?.message;

  return (
    <Form {...form}>
      <form className="flex flex-col" onSubmit={submitPortfolio}>
        <header className="border-b border-border px-6 py-5">
          <DialogTitle>Nowy portfel</DialogTitle>
          <DialogDescription className="mt-1">Osobny koszyk aktywów.</DialogDescription>
        </header>

        <div className="space-y-4 px-6 py-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwa portfela</FormLabel>
                <FormControl>
                  <Input autoComplete="off" placeholder="np. Długoterminowy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="baseCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waluta bazowa</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="inline-flex h-10 justify-between whitespace-nowrap">
                      <SelectValue placeholder="Wybierz walutę" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolioBaseCurrencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isTaxAdvantaged"
            render={({ field }) => (
              <FormItem className="rounded-md border border-border/70 bg-muted/20 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <FormLabel className="text-sm">Konto emerytalne (IKE/IKZE)</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Wplywa na sugestie netto dla dywidend.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      aria-label="Konto emerytalne IKE lub IKZE"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {rootError ? <p className="text-sm text-destructive">{rootError}</p> : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="ghost">
            Anuluj
          </Button>
          <Button disabled={!form.formState.isValid || isSubmitting} type="submit">
            Utwórz portfel
          </Button>
        </footer>
      </form>
    </Form>
  );
}
