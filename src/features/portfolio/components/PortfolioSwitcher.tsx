"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";
import { cn } from "@/lib/cn";

import { createPortfolio } from "../client/create-portfolio";
import {
  createPortfolioSchema,
  type CreatePortfolioInput,
} from "../lib/create-portfolio-schema";
import { portfolioBaseCurrencies } from "../lib/base-currency";

const ALL_VALUE = "all";

type PortfolioOption = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
}>;

type Props = Readonly<{
  portfolios: readonly PortfolioOption[];
  selectedId: string | null;
  resetPageParam?: boolean;
  disabled?: boolean;
  className?: string;
}>;

export function PortfolioSwitcher({
  portfolios,
  selectedId,
  resetPageParam = false,
  disabled = false,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  const buildUrl = (nextPortfolioId: string | null) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (nextPortfolioId) {
      params.set("portfolio", nextPortfolioId);
    } else {
      params.delete("portfolio");
    }

    if (resetPageParam) {
      params.set("page", "1");
    } else {
      params.delete("page");
    }

    const queryString = params.toString();
    return queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
  };

  const handlePortfolioChange = (nextValue: string) => {
    const nextPortfolioId = nextValue === ALL_VALUE ? null : nextValue;
    router.push(buildUrl(nextPortfolioId), { scroll: false });
  };

  const submitPortfolio = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    form.clearErrors("root");

    try {
      const created = await createPortfolio(values);
      form.reset({ name: "", baseCurrency: values.baseCurrency });
      setIsDialogOpen(false);
      router.push(buildUrl(created.id), { scroll: false });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się utworzyć portfela.";
      form.setError("root", { message });
    } finally {
      setIsSubmitting(false);
    }
  });

  const currentValue = selectedId ?? ALL_VALUE;
  const rootError = form.formState.errors.root?.message;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3",
        className
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">Portfel</span>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select
          disabled={disabled}
          onValueChange={handlePortfolioChange}
          value={currentValue}
        >
          <SelectTrigger className="inline-flex h-10 min-w-[220px] justify-between whitespace-nowrap">
            <SelectValue placeholder="Wszystkie portfele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Wszystkie portfele</SelectItem>
            {portfolios.map((portfolio) => (
              <SelectItem key={portfolio.id} value={portfolio.id}>
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate">{portfolio.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {portfolio.baseCurrency}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(nextOpen) => {
            setIsDialogOpen(nextOpen);
            if (!nextOpen) {
              form.reset({
                name: "",
                baseCurrency: portfolioBaseCurrencies[0],
              });
              form.clearErrors();
            }
          }}
        >
          <Button
            disabled={disabled}
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            Nowy portfel
          </Button>

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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
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
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">
                      Anuluj
                    </Button>
                  </DialogClose>
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
      </div>
    </div>
  );
}
