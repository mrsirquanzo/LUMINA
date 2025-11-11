"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BarChartProps {
  data: any[];
  xKey: string;
  bars: {
    key: string;
    name: string;
    color?: string;
  }[];
  yAxisLabel?: string;
  xAxisLabel?: string;
  layout?: "horizontal" | "vertical";
}

export default function BarChart({
  data,
  xKey,
  bars,
  yAxisLabel,
  xAxisLabel,
  layout = "horizontal",
}: BarChartProps) {
  const colors = ["#3b82f6", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={layout === "horizontal" ? xKey : undefined}
          type={layout === "horizontal" ? "category" : "number"}
          label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -5 } : undefined}
          stroke="#6b7280"
        />
        <YAxis
          dataKey={layout === "vertical" ? xKey : undefined}
          type={layout === "horizontal" ? "number" : "category"}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined}
          stroke="#6b7280"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Legend />
        {bars.map((bar, index) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name}
            fill={bar.color || colors[index % colors.length]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
