import type { Meta, StoryObj } from "@storybook/react";

import { Container } from "@/features/common";
import { AllocationDonutChart } from "../components/AllocationDonutChart";
import type { DonutSlice } from "../components/AllocationDonutChart";
import { ChartCard } from "../components/ChartCard";
import { DesignSurface } from "../components/DesignSurface";
import { DailyReturnsBarChart } from "../components/DailyReturnsBarChart";
import { PnlBarChart } from "../components/PnlBarChart";
import { PortfolioAreaChart } from "../components/PortfolioAreaChart";
import { mockHoldingsUsd } from "../fixtures/mockPortfolio";
import { mockPnl14d, mockPortfolioValue30d } from "../fixtures/mockCharts";
import { formatMoney, formatNumber, formatPercent } from "../lib/format";

function ChartsStory() {
  const locale = "pl-PL";

  const allocationTotal = mockHoldingsUsd.reduce(
    (sum, holding) => sum + holding.shares * holding.price.amount,
    0
  );

  const allocation = mockHoldingsUsd.map((holding, idx) => {
    const value = holding.shares * holding.price.amount;
    const share = allocationTotal === 0 ? 0 : value / allocationTotal;

    return {
      symbol: holding.symbol,
      share,
      value,
      color: `var(--chart-${((idx % 5) + 1) as 1 | 2 | 3 | 4 | 5})`,
    };
  });

  const donutData: readonly DonutSlice[] = allocation.map((row) => ({
    id: row.symbol,
    value: row.value,
    color: row.color,
    tooltipLabel: row.symbol,
    tooltipValue: formatMoney(locale, { amount: row.value, currency: "USD" }),
  }));

  const dailyReturns7d = [
    { label: "30 sty", value: 0 },
    { label: "31 sty", value: 0 },
    { label: "01 lut", value: 0 },
    { label: "02 lut", value: -0.0133 },
    { label: "03 lut", value: 0.0304 },
    { label: "04 lut", value: 0.0111 },
    { label: "05 lut", value: 0.0327 },
  ] as const;

  return (
    <DesignSurface className="p-6">
      <Container className="max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Wykresy (Recharts)</h1>
          <p className="text-sm text-muted-foreground">
            Komponenty Recharts podpięte pod semantyczne tokeny kolorów.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Wartość portfela"
            subtitle="Mockowana krzywa 30D (chart-1)."
            right={
              <div className="text-right">
                <div className="text-xs font-medium text-muted-foreground">
                  Aktualnie
                </div>
                <div className="font-mono text-sm tabular-nums">
                  {formatMoney(locale, {
                    amount: mockPortfolioValue30d[mockPortfolioValue30d.length - 1]?.value ?? 0,
                    currency: "USD",
                  })}
                </div>
              </div>
            }
          >
          <PortfolioAreaChart
            data={mockPortfolioValue30d}
            valueFormatter={(value) =>
              formatMoney(locale, { amount: value, currency: "USD" })
            }
          />
          </ChartCard>

          <ChartCard
            title="Alokacja"
            subtitle="Donut używa tokenów chart-1..5."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AllocationDonutChart data={donutData} />
              <div className="space-y-3">
                {allocation.map((row) => (
                  <div key={row.symbol} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: row.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-mono text-sm tabular-nums">
                        {row.symbol}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatPercent(locale, row.share, {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div className="font-mono text-xs tabular-nums">
                        {formatMoney(locale, { amount: row.value, currency: "USD" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="Dzienny P/L"
          subtitle="Słupki mapują plus/minus na chart-2/chart-3."
          right={
            <div className="text-right">
              <div className="text-xs font-medium text-muted-foreground">
                Suma
              </div>
              <div className="font-mono text-sm tabular-nums">
                {formatNumber(
                  locale,
                  mockPnl14d.reduce((sum, row) => sum + row.pnl, 0),
                  { signDisplay: "always", maximumFractionDigits: 0 }
                )}
              </div>
            </div>
          }
        >
          <PnlBarChart data={mockPnl14d} />
        </ChartCard>

        <ChartCard
          title="Zwroty dzienne (7D)"
          subtitle="Mini słupki z zerem jako linią odniesienia."
        >
          <DailyReturnsBarChart data={dailyReturns7d} height={140} />
        </ChartCard>
      </Container>
    </DesignSurface>
  );
}

const meta: Meta<typeof ChartsStory> = {
  title: "Design System/Charts (Recharts)",
  component: ChartsStory,
};

export default meta;
type Story = StoryObj<typeof ChartsStory>;

export const Charts: Story = {};
