import type { Meta, StoryObj } from "@storybook/react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

type HoldingRow = {
  ticker: string;
  name: string;
  quantity: string;
  avgPrice: string;
  lastPrice: string;
  value: string;
  change: string;
  changeValue: number;
  allocation: string;
};

const rows: HoldingRow[] = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    quantity: "12.5000",
    avgPrice: "720.00",
    lastPrice: "750.00",
    value: "9,375.00",
    change: "+2.29%",
    changeValue: 2.29,
    allocation: "32.5%",
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    quantity: "8.2000",
    avgPrice: "1,380.00",
    lastPrice: "1,345.00",
    value: "11,029.00",
    change: "-2.54%",
    changeValue: -2.54,
    allocation: "38.2%",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA",
    quantity: "3.4000",
    avgPrice: "1,850.00",
    lastPrice: "1,920.00",
    value: "6,528.00",
    change: "+3.78%",
    changeValue: 3.78,
    allocation: "22.6%",
  },
  {
    ticker: "TSLA",
    name: "Tesla",
    quantity: "5.8000",
    avgPrice: "920.00",
    lastPrice: "860.00",
    value: "4,988.00",
    change: "-6.52%",
    changeValue: -6.52,
    allocation: "17.3%",
  },
];

const meta: Meta<typeof Table> = {
  title: "Components/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto w-full max-w-6xl">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const PortfolioTable: Story = {
  render: () => (
    <Table>
      <TableCaption>Portfolio snapshot</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker / Name</TableHead>
          <TableHead data-align="right" className="text-right">
            Quantity
          </TableHead>
          <TableHead data-align="right" className="text-right">
            Avg Price (PLN)
          </TableHead>
          <TableHead data-align="right" className="text-right">
            Last Price (PLN)
          </TableHead>
          <TableHead data-align="right" className="text-right">
            Value (PLN)
          </TableHead>
          <TableHead data-align="right" className="text-right">
            Change
          </TableHead>
          <TableHead data-align="right" className="text-right">
            Allocation
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.ticker}>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {row.ticker}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {row.name}
                </span>
              </div>
            </TableCell>
            <TableCell data-align="right" className="tabular-nums">
              {row.quantity}
            </TableCell>
            <TableCell data-align="right" className="tabular-nums">
              {row.avgPrice}
            </TableCell>
            <TableCell data-align="right" className="tabular-nums">
              {row.lastPrice}
            </TableCell>
            <TableCell data-align="right" className="tabular-nums font-medium">
              {row.value}
            </TableCell>
            <TableCell
              data-align="right"
              className={[
                "tabular-nums",
                row.changeValue > 0
                  ? "text-emerald-600 dark:text-emerald-500"
                  : row.changeValue < 0
                    ? "text-red-600 dark:text-red-500"
                    : "text-muted-foreground",
              ].join(" ")}
            >
              {row.change}
            </TableCell>
            <TableCell data-align="right" className="tabular-nums">
              {row.allocation}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
