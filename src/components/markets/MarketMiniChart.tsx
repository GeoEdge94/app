"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface MarketMiniChartProps {
  yesPrice: number;
  trend?: "up" | "down" | "stable";
  height?: number;
}

function generateSparkline(current: number, points = 20): { t: number; p: number }[] {
  const data: { t: number; p: number }[] = [];
  let p = current + (Math.random() - 0.5) * 0.3;
  for (let i = 0; i < points; i++) {
    p = Math.max(0.05, Math.min(0.95, p + (Math.random() - 0.48) * 0.04));
    data.push({ t: i, p: Math.round(p * 100) / 100 });
  }
  // Ensure last point is close to current
  data[points - 1] = { t: points - 1, p: current };
  return data;
}

export function MarketMiniChart({ yesPrice, height = 32 }: MarketMiniChartProps) {
  const data = useMemo(() => generateSparkline(yesPrice), [yesPrice]);
  const isUp = data[data.length - 1].p >= data[0].p;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`mc-${isUp ? "g" : "r"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUp ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isUp ? "#10B981" : "#EF4444"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="p"
            stroke={isUp ? "#10B981" : "#EF4444"}
            strokeWidth={1.5}
            fill={`url(#mc-${isUp ? "g" : "r"})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
