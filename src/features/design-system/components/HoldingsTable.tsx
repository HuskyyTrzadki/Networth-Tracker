import { cn } from "@/lib/cn";

type Row = Readonly<{
  symbol: string;
  name: string;
  shares: string;
  price: string;
  value: string;
  change: React.ReactNode;
}>;

type Props = Readonly<{
  title: string;
  columns: Readonly<{
    symbol: string;
    name: string;
    shares: string;
    price: string;
    value: string;
    day: string;
  }>;
  rows: readonly Row[];
  className?: string;
}>;

export function HoldingsTable({ title, columns, rows, className }: Props) {
  return (
    <div className={cn("rounded-md border border-border/80 bg-card", className)}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-t border-border bg-secondary">
            <tr className="text-left text-xs font-medium text-muted-foreground">
              <th className="px-4 py-2">{columns.symbol}</th>
              <th className="px-4 py-2">{columns.name}</th>
              <th className="px-4 py-2 text-right">{columns.shares}</th>
              <th className="px-4 py-2 text-right">{columns.price}</th>
              <th className="px-4 py-2 text-right">{columns.value}</th>
              <th className="px-4 py-2 text-right">{columns.day}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.symbol} className="text-sm">
                <td className="px-4 py-2 font-mono tabular-nums">{row.symbol}</td>
                <td className="px-4 py-2">{row.name}</td>
                <td className="px-4 py-2 text-right font-mono tabular-nums">
                  {row.shares}
                </td>
                <td className="px-4 py-2 text-right font-mono tabular-nums">
                  {row.price}
                </td>
                <td className="px-4 py-2 text-right font-mono tabular-nums">
                  {row.value}
                </td>
                <td className="px-4 py-2 text-right">{row.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
