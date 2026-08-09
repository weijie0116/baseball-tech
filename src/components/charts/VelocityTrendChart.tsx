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

export function VelocityTrendChart({
  data,
}: {
  data: { date: string; max_velocity_kph: number | null; max_spin_rate_rpm: number | null }[];
}) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">尚無投球數據。</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis yAxisId="velocity" fontSize={12} width={40} />
        <YAxis yAxisId="spin" orientation="right" fontSize={12} width={44} />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="velocity"
          type="monotone"
          dataKey="max_velocity_kph"
          name="最快球速 (km/h)"
          stroke="var(--chart-1, #2563eb)"
          connectNulls
        />
        <Line
          yAxisId="spin"
          type="monotone"
          dataKey="max_spin_rate_rpm"
          name="最高轉速 (rpm)"
          stroke="var(--chart-2, #f59e0b)"
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
