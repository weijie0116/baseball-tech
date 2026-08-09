"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export function GrowthChart({
  data,
}: {
  data: { date: string; height_cm: number | null; weight_kg: number | null }[];
}) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">尚無身高體重紀錄。</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis yAxisId="height" fontSize={12} width={40} />
        <YAxis yAxisId="weight" orientation="right" fontSize={12} width={40} />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="height"
          type="monotone"
          dataKey="height_cm"
          name="身高 (cm)"
          stroke="var(--chart-1, #2563eb)"
          connectNulls
        />
        <Line
          yAxisId="weight"
          type="monotone"
          dataKey="weight_kg"
          name="體重 (kg)"
          stroke="var(--chart-2, #f59e0b)"
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
