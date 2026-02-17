"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Dialog,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";

import { createPortfolio } from "../client/create-portfolio";
import {
  createPortfolioSchema,
  type CreatePortfolioInput,
} from "../lib/create-portfolio-schema";
import { portfolioBaseCurrencies } from "../lib/base-currency";

export type CreatePortfolioDialogProps = Readonly<{
  disabled?: boolean;
  onCreated: (createdPortfolioId: string) => void;
  trigger: (controls: { open: () => void; disabled: boolean }) => React.ReactNode;
  createPortfolioFn?: (input: CreatePortfolioInput) => Promise<{ id: string }>;
}>;

export function CreatePortfolioDialog({
  disabled = false,
  onCreated,
  trigger,
  createPortfolioFn,
}: CreatePortfolioDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePortfolioInput>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      name: "",
      baseCurrency: portfolioBaseCurrencies[0],
    },
    mode: "onChange",
  });

  const resetForm = () => {
    form.reset({
      name: "",
      baseCurrency: portfolioBaseCurrencies[0],
    });
    form.clearErrors();
  };

  const submitPortfolio = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    form.clearErrors("root");

    const create = createPortfolioFn ?? createPortfolio;
    const created = await create(values).catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się utworzyć portfela.";
      form.setError("root", { message });
      setIsSubmitting(false);
      return null;
    });
    if (!created) {
      return;
    }

    resetForm();
    setIsDialogOpen(false);
    onCreated(created.id);
    setIsSubmitting(false);
  });

  const rootError = form.formState.errors.root?.message;

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(nextOpen) => {
        setIsDialogOpen(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      {trigger({
        open: () => setIsDialogOpen(true),
        disabled: disabled || isSubmitting,
      })}

      <DialogContent className="p-0 sm:max-w-md">
        <Form {...form}>
          <form className="flex flex-col" onSubmit={submitPortfolio}>
            <header className="border-b border-border px-6 py-5">
              <DialogTitle>Nowy portfel</DialogTitle>
              <DialogDescription className="mt-1">
                Utwórz osobny portfel do śledzenia aktywów.
              </DialogDescription>
            </header>

            <div className="space-y-4 px-6 py-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa portfela</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="off"
                        placeholder="np. Długoterminowy"
                        {...field}
                      />
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

              {rootError ? (
                <p className="text-sm text-destructive">{rootError}</p>
              ) : null}
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
              <Button
                disabled={isSubmitting}
                onClick={() => setIsDialogOpen(false)}
                type="button"
                variant="ghost"
              >
                Anuluj
              </Button>
              <Button
                disabled={!form.formState.isValid || isSubmitting}
                type="submit"
              >
                Utwórz portfel
              </Button>
            </footer>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
