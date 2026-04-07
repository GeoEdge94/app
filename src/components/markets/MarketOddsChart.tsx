"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

function generateHistory(currentYes: number, days: number) {
  const now = new Date();
  let p = currentYes + (Math.random() - 0.5) * 0.25;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    p = Math.max(0.05, Math.min(0.95, p + (Math.random() - 0.47) * 0.03));
    const vol = Math.round(200 + Math.random() * 2500 + (i > days - 3 ? 1500 : 0));
    return {
      date: d.toISOString().slice(5, 10),
      yes: Math.round(p * 100),
      no: Math.round((1 - p) * 100),
      volume: vol,
    };
  });
}

export function MarketOddsChart({ yesPrice, title }: { yesPrice: number; title: string }) {
  const data = useMemo(() => generateHistory(yesPrice, 14), [yesPrice]);

  return (
    <Tabs defaultValue="prob" className="w-full">
      <TabsList className="w-full h-7">
        <TabsTrigger value="prob" className="flex-1 text-[10px] gap-1"><TrendingUp className="h-2.5 w-2.5" /> Probabilite</TabsTrigger>
        <TabsTrigger value="vol" className="flex-1 text-[10px] gap-1"><BarChart3 className="h-2.5 w-2.5" /> Volume</TabsTrigger>
      </TabsList>

      <TabsContent value="prob" className="mt-1.5">
        <Card>
          <CardContent className="p-2.5">
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="yg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={24} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} formatter={(v) => [`${v}%`, "Oui"]} />
                  <Area type="monotone" dataKey="yes" stroke="#10B981" strokeWidth={2} fill="url(#yg)" dot={{ r: 1.5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="vol" className="mt-1.5">
        <Card>
          <CardContent className="p-2.5">
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={24} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} formatter={(v) => [`${Number(v).toLocaleString()} EUR`, "Volume"]} />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
