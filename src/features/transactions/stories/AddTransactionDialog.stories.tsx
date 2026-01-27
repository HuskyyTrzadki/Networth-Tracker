import type { Meta, StoryObj } from "@storybook/react";
import { format } from "date-fns";
import { useState } from "react";

import { AddTransactionDialog } from "@/features/transactions";
import { Button } from "@/features/design-system/components/ui/button";
import type { InstrumentSearchResult } from "@/features/transactions/lib/instrument-search";
import type { InstrumentSearchClient } from "@/features/transactions/client/search-instruments";

const mockResults: InstrumentSearchResult[] = [
  {
    id: "yahoo:AAPL",
    provider: "yahoo",
    providerKey: "AAPL",
    symbol: "AAPL",
    ticker: "AAPL",
    name: "Apple Inc.",
    currency: "USD",
    instrumentType: "EQUITY",
    exchange: "NASDAQ",
    logoUrl: null,
  },
  {
    id: "yahoo:BTC-USD",
    provider: "yahoo",
    providerKey: "BTC-USD",
    symbol: "BTC-USD",
    ticker: "BTC",
    name: "Bitcoin",
    currency: "USD",
    instrumentType: "CRYPTOCURRENCY",
    exchange: "CRYPTO",
    logoUrl: null,
  },
  {
    id: "yahoo:XTB.WA",
    provider: "yahoo",
    providerKey: "XTB.WA",
    symbol: "XTB.WA",
    ticker: "XTB",
    name: "XTB S.A.",
    currency: "PLN",
    instrumentType: "EQUITY",
    exchange: "WSE",
    logoUrl: null,
  },
] as const;

const mockSearchClient: InstrumentSearchClient = async (
  query,
  _options,
  signal
) => {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  return mockResults.filter(
    (item) =>
      item.ticker.toLowerCase().includes(normalized) ||
      item.symbol.toLowerCase().includes(normalized) ||
      item.name.toLowerCase().includes(normalized)
  );
};

const meta: Meta<typeof AddTransactionDialog> = {
  title: "Transactions/Add Transaction Dialog",
  component: AddTransactionDialog,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof AddTransactionDialog>;

function Demo() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-dvh bg-background p-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Background</div>
            <div className="text-sm text-muted-foreground">
              Dialog overlay should feel intentional.
            </div>
          </div>
          <Button onClick={() => setOpen(true)} size="lg">
            Open modal
          </Button>
        </div>
      </div>

      <AddTransactionDialog
        onOpenChange={setOpen}
        open={open}
        searchClient={mockSearchClient}
        portfolioId="portfolio-demo"
      />
    </div>
  );
}

function FilledDemo() {
  const [open, setOpen] = useState(true);
  const initialInstrument = mockResults[0];

  return (
    <div className="min-h-dvh bg-background p-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Filled example</div>
            <div className="text-sm text-muted-foreground">
              Shows the “ready to save” state.
            </div>
          </div>
          <Button onClick={() => setOpen(true)} size="lg">
            Open modal
          </Button>
        </div>
      </div>

      <AddTransactionDialog
        initialValues={{
          type: "BUY",
          date: format(new Date(), "yyyy-MM-dd"),
          quantity: "10",
          price: "100",
          fee: "1",
          notes: "Earnings dip",
        }}
        initialInstrument={initialInstrument}
        onOpenChange={setOpen}
        open={open}
        searchClient={mockSearchClient}
        portfolioId="portfolio-demo"
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <Demo />,
};

export const Filled: Story = {
  render: () => <FilledDemo />,
};
