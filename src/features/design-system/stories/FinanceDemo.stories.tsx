import type { Meta, StoryObj } from "@storybook/react";
import { useLocale, useTranslations } from "next-intl";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";
import { ChangePill } from "../components/ChangePill";
import { DesignSurface } from "../components/DesignSurface";
import { HoldingsTable } from "../components/HoldingsTable";
import { MetricCard } from "../components/MetricCard";
import { Sparkline } from "../components/Sparkline";
import { mockHoldingsUsd, mockUsdPln } from "../fixtures/mockPortfolio";
import { convertCurrency, formatMoney, formatNumber, formatPercent } from "../lib/format";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

type DemoButtonProps = Readonly<{
  variant?: ButtonVariant;
  className?: string;
}> &
  Omit<ComponentPropsWithoutRef<"button">, "className">;

function DemoButton({ variant = "primary", className, ...props }: DemoButtonProps) {
  const variantClasses =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:brightness-95 active:brightness-90"
      : variant === "secondary"
        ? "bg-secondary text-secondary-foreground hover:brightness-95 active:brightness-90"
        : variant === "destructive"
          ? "bg-destructive text-destructive-foreground hover:brightness-95 active:brightness-90"
          : "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground";

  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses,
        className
      )}
      type="button"
      {...props}
    />
  );
}

type DemoInputProps = Readonly<{ className?: string }> &
  Omit<ComponentPropsWithoutRef<"input">, "className">;

function DemoInput({ className, ...props }: DemoInputProps) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      {...props}
    />
  );
}

function SidebarNavItem({
  active,
  children,
}: Readonly<{ active?: boolean; children: ReactNode }>) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {children}
    </button>
  );
}

function FinanceDemoStory() {
  const t = useTranslations("DesignSystem.FinanceDemo");
  const locale = useLocale();

  const totalUsd = mockHoldingsUsd.reduce(
    (sum, holding) => sum + holding.shares * holding.price.amount,
    0
  );

  const totalPln = convertCurrency(
    { amount: totalUsd, currency: "USD" },
    mockUsdPln
  );

  const weightedDayChange = mockHoldingsUsd.reduce((sum, holding) => {
    const value = holding.shares * holding.price.amount;
    return sum + value * holding.dayChangePct;
  }, 0);
  const dayChangePct = totalUsd === 0 ? 0 : weightedDayChange / totalUsd;

  const trend = dayChangePct > 0 ? "up" : dayChangePct < 0 ? "down" : "flat";

  const rows = mockHoldingsUsd.map((holding) => {
    const positionValue = holding.shares * holding.price.amount;
    const changeTrend =
      holding.dayChangePct > 0 ? "up" : holding.dayChangePct < 0 ? "down" : "flat";

    return {
      symbol: holding.symbol,
      name: holding.name,
      shares: formatNumber(locale, holding.shares, { maximumFractionDigits: 2 }),
      price: formatMoney(locale, holding.price, { maximumFractionDigits: 2 }),
      value: formatMoney(locale, { amount: positionValue, currency: "USD" }),
      change: (
        <ChangePill
          trend={changeTrend}
          value={formatPercent(locale, holding.dayChangePct, { signDisplay: "always" })}
        />
      ),
    };
  });

  return (
    <DesignSurface className="p-0">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
          <div className="px-4 py-5">
            <div className="text-sm font-semibold tracking-tight">{t("appName")}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t("appSubtitle")}</div>
          </div>

          <nav className="px-2">
            <div className="px-3 pb-2 text-xs font-medium text-muted-foreground">
              {t("navTitle")}
            </div>
            <div className="space-y-1">
              <SidebarNavItem active>{t("navOverview")}</SidebarNavItem>
              <SidebarNavItem>{t("navHoldings")}</SidebarNavItem>
              <SidebarNavItem>{t("navTransactions")}</SidebarNavItem>
              <SidebarNavItem>{t("navSettings")}</SidebarNavItem>
            </div>
          </nav>

          <div className="mt-auto p-4">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-3 shadow-sm">
              <div className="text-xs font-semibold">{t("sidebarCalloutTitle")}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("sidebarCalloutBody")}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-background">
          <div className="border-b border-border bg-card shadow-sm">
            <div className="mx-auto max-w-6xl px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("fxRateLabel")}{" "}
                    {formatNumber(locale, mockUsdPln.rate, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="w-full sm:w-80">
                    <DemoInput placeholder={t("searchPlaceholder")} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DemoButton variant="primary">{t("actionAdd")}</DemoButton>
                    <DemoButton variant="secondary">{t("actionExport")}</DemoButton>
                    <DemoButton variant="destructive">{t("actionDelete")}</DemoButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    {t("sparklineRangeLabel")}
                  </div>
                  <Sparkline values={[10, 10.1, 10.08, 10.2, 10.3, 10.28, 10.42]} />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted px-3 py-2 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    {t("marketStatusLabel")}
                  </div>
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {t("marketStatusValue")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricCard
                label={t("totalValueUsd")}
                value={formatMoney(locale, { amount: totalUsd, currency: "USD" })}
              />
              <MetricCard
                label={t("totalValuePln")}
                value={formatMoney(locale, totalPln)}
              />
              <MetricCard
                label={t("dayChange")}
                value={formatPercent(locale, dayChangePct, { signDisplay: "always" })}
                right={
                  <ChangePill
                    trend={trend}
                    value={formatPercent(locale, dayChangePct, { signDisplay: "always" })}
                  />
                }
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <HoldingsTable
                className="lg:col-span-2"
                title={t("holdingsTitle")}
                columns={{
                  symbol: t("symbol"),
                  name: t("name"),
                  shares: t("shares"),
                  price: t("price"),
                  value: t("value"),
                  day: t("day"),
                }}
                rows={rows}
              />

              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{t("allocationTitle")}</div>
                    <DemoButton variant="ghost" className="h-8 px-2 text-xs shadow-none">
                      {t("allocationAction")}
                    </DemoButton>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[
                      { label: t("allocationEquities"), pct: 0.62, bar: "bg-chart-1" },
                      { label: t("allocationCash"), pct: 0.18, bar: "bg-chart-2" },
                      { label: t("allocationCrypto"), pct: 0.11, bar: "bg-chart-5" },
                      { label: t("allocationBonds"), pct: 0.06, bar: "bg-chart-4" },
                      { label: t("allocationOther"), pct: 0.03, bar: "bg-chart-3" },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="truncate">{row.label}</div>
                          <div className="font-mono text-xs tabular-nums text-muted-foreground">
                            {formatPercent(locale, row.pct, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-muted">
                          <div
                            className={cn("h-2 rounded-full", row.bar)}
                            style={{ width: `${row.pct * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-sm">
                  <div className="text-sm font-semibold">{t("insightTitle")}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{t("insightBody")}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-card-foreground shadow-sm">
                      {t("tagDelayedQuotes")}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-card-foreground shadow-sm">
                      {t("tagFxCached")}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-card-foreground shadow-sm">
                      {t("tagRlsReady")}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-destructive p-4 text-destructive-foreground shadow-sm">
                  <div className="text-sm font-semibold">{t("destructiveTitle")}</div>
                  <p className="mt-2 text-sm opacity-90">{t("destructiveBody")}</p>
                  <div className="mt-4">
                    <DemoButton
                      variant="secondary"
                      className="h-8 px-2 text-xs shadow-none"
                    >
                      {t("destructiveAction")}
                    </DemoButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DesignSurface>
  );
}

const meta: Meta<typeof FinanceDemoStory> = {
  title: "Design System/Finance Demo",
  component: FinanceDemoStory,
};

export default meta;
type Story = StoryObj<typeof FinanceDemoStory>;

export const Demo: Story = {};
