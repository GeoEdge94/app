"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

const mockOddsHistory = [
  { day: "J-7", odds: 2.5 },
  { day: "J-6", odds: 2.3 },
  { day: "J-5", odds: 2.1 },
  { day: "J-4", odds: 2.0 },
  { day: "J-3", odds: 1.9 },
  { day: "J-2", odds: 1.85 },
  { day: "J-1", odds: 1.82 },
  { day: "Auj", odds: 1.8 },
];

export function OddsChart({ zoneName }: { zoneName: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs font-semibold mb-2 text-muted-foreground">Cotes 7j — {zoneName}</p>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockOddsHistory}>
              <defs>
                <linearGradient id="oddsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[1.5, 3]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                formatter={(value) => [`x${value}`, "Cote"]}
              />
              <Area
                type="monotone"
                dataKey="odds"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#oddsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
