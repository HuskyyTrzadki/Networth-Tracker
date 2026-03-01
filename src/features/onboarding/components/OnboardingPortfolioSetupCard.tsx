"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/features/design-system/components/ui/card";
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
import { portfolioBaseCurrencies } from "@/features/portfolio/lib/base-currency";
import {
  createPortfolioSchema,
  type CreatePortfolioInput,
} from "@/features/portfolio/lib/create-portfolio-schema";
import { createPortfolioAction } from "@/features/portfolio/server/create-portfolio-action";

type CreatedPortfolio = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
  isTaxAdvantaged: boolean;
}>;

type Props = Readonly<{
  onCreated: (portfolio: CreatedPortfolio) => void;
}>;

export function OnboardingPortfolioSetupCard({ onCreated }: Props) {
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

  const submitPortfolio = form.handleSubmit((values) => {
    form.clearErrors("root");

    startSubmitTransition(() => {
      void createPortfolioAction(values)
        .then((created) => {
          onCreated({
            id: created.id,
            name: values.name.trim(),
            baseCurrency: values.baseCurrency,
            isTaxAdvantaged: values.isTaxAdvantaged,
          });
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

  return (
    <Card className="max-w-2xl border-border/75">
      <CardHeader className="space-y-3">
        <CardTitle className="text-3xl font-semibold tracking-tight">
          Załóż własny portfel
        </CardTitle>

      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form className="space-y-5" onSubmit={submitPortfolio}>
            <div className="grid gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)]">
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
            </div>

            <FormField
              control={form.control}
              name="isTaxAdvantaged"
              render={({ field }) => (
                <FormItem className="rounded-md border border-border/70 bg-muted/20 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <FormLabel className="text-sm">Konto emerytalne (IKE/IKZE)</FormLabel>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Włącz, jeśli ten portfel ma rozliczać podatkowe konto emerytalne.
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

            {form.formState.errors.root?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <div className="flex justify-start">
              <Button
                className="h-11 rounded-md px-5"
                disabled={!form.formState.isValid || isSubmitting}
                type="submit"
              >
                Utwórz portfel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
