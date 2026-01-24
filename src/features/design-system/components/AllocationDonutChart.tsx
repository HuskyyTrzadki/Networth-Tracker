import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export type DonutSlice = Readonly<{
  id: string;
  value: number;
  color: string;
}>;

type Props = Readonly<{
  data: readonly DonutSlice[];
  height?: number;
}>;

export function AllocationDonutChart({ data, height = 240 }: Props) {
  const chartData = [...data];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="id"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {chartData.map((slice) => (
              <Cell key={slice.id} fill={slice.color} stroke="var(--card)" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
