"use client";

import dynamic from "next/dynamic";

const loadRechartsComponent = (name: string) =>
  dynamic(
    async () => {
      const rechartsLib = await import("recharts");
      return rechartsLib[name as keyof typeof rechartsLib] as React.ComponentType<
        Record<string, unknown>
      >;
    },
    { ssr: false }
  );

export const Area = loadRechartsComponent("Area");
export const AreaChart = loadRechartsComponent("AreaChart");
export const Bar = loadRechartsComponent("Bar");
export const BarChart = loadRechartsComponent("BarChart");
export const CartesianGrid = loadRechartsComponent("CartesianGrid");
export const Cell = loadRechartsComponent("Cell");
export const ComposedChart = loadRechartsComponent("ComposedChart");
export const Line = loadRechartsComponent("Line");
export const LineChart = loadRechartsComponent("LineChart");
export const Pie = loadRechartsComponent("Pie");
export const PieChart = loadRechartsComponent("PieChart");
export const ReferenceLine = loadRechartsComponent("ReferenceLine");
export const ReferenceDot = loadRechartsComponent("ReferenceDot");
export const ResponsiveContainer = loadRechartsComponent("ResponsiveContainer");
export const Tooltip = loadRechartsComponent("Tooltip");
export const XAxis = loadRechartsComponent("XAxis");
export const YAxis = loadRechartsComponent("YAxis");
