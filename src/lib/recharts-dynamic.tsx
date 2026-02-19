"use client";

// Recharts inspects child component types (e.g. XAxis, Line) inside chart roots.
// Dynamic wrappers can hide those identities and lead to empty charts.
// Keep this module client-only and re-export native Recharts components directly.
export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
