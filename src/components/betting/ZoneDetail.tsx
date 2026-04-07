"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskBadge } from "@/components/shared/RiskBadge";
import {
  Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Flame, Thermometer, Droplets, Wind, CloudRain, TrendingUp, TrendingDown,
  Calendar, Target, BarChart3, ChevronLeft,
} from "lucide-react";
import { generateOddsHistory } from "@/lib/mock-data";
import { RISK_BG } from "@/lib/risk-colors";
import type { BettingZone } from "@/types";

interface ZoneDetailProps {
  zone: BettingZone;
  onBack: () => void;
}

export function ZoneDetail({ zone, onBack }: ZoneDetailProps) {
  const history = useMemo(() => generateOddsHistory(zone.odds["7d"], 14), [zone.odds]);
  const latestOdds = history[history.length - 1];
  const prevOdds = history[history.length - 2];
  const oddsTrend = latestOdds.odds - prevOdds.odds;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1 rounded-md hover:bg-accent">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate">{zone.name}</h3>
          <p className="text-[11px] text-muted-foreground">{zone.department}</p>
        </div>
        <RiskBadge level={zone.riskLevel} />
      </div>

      {/* Probability gauge */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" /> Probabilite incendie
            </span>
            <span className="text-[10px] text-muted-foreground">FWI {zone.fwiIndex}/100</span>
          </div>

          {/* Gauge bar */}
          <div className="relative h-5 bg-gradient-to-r from-emerald-200 via-amber-200 via-orange-200 to-red-300 rounded-full overflow-hidden mb-1">
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-700"
              style={{ width: `${zone.probability["7d"] * 100}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md"
              style={{ left: `${zone.probability["7d"] * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span className="font-bold text-foreground text-sm tabular-nums">
              {Math.round(zone.probability["7d"] * 100)}%
            </span>
            <span>100%</span>
          </div>

          {/* Horizon breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-xs font-bold text-destructive tabular-nums">{Math.round(zone.probability["7d"] * 100)}%</p>
              <p className="text-[9px] text-muted-foreground">7 jours</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-xs font-bold text-orange-600 tabular-nums">{Math.round(zone.probability["30d"] * 100)}%</p>
              <p className="text-[9px] text-muted-foreground">30 jours</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-xs font-bold text-amber-600 tabular-nums">96%</p>
              <p className="text-[9px] text-muted-foreground">Saison</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cotes + Volume tabs */}
      <Tabs defaultValue="odds" className="w-full">
        <TabsList className="w-full h-8">
          <TabsTrigger value="odds" className="flex-1 text-[11px] gap-1">
            <TrendingUp className="h-3 w-3" /> Cotes
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex-1 text-[11px] gap-1">
            <BarChart3 className="h-3 w-3" /> Volume
          </TabsTrigger>
        </TabsList>

        <TabsContent value="odds" className="mt-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">Evolution cotes 14j</span>
                <div className="flex items-center gap-1">
                  <span className="text-base font-bold text-primary tabular-nums">x{latestOdds.odds}</span>
                  {oddsTrend < 0 ? (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                  )}
                  <span className={`text-[10px] font-medium ${oddsTrend < 0 ? "text-destructive" : "text-emerald-600"}`}>
                    {oddsTrend > 0 ? "+" : ""}{oddsTrend.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="ogr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 8 }} axisLine={false} tickLine={false}
                      tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={28}
                      tickFormatter={(v: number) => `x${v}`} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      formatter={(v) => [`x${v}`, "Cote"]}
                      labelFormatter={(l) => `Date: ${l}`} />
                    <Area type="monotone" dataKey="odds" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#ogr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Dated cotes table */}
              <div className="mt-2 max-h-24 overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-4 gap-x-2 text-[9px] text-muted-foreground font-medium border-b border-border pb-1 mb-1">
                  <span>Date</span><span className="text-right">Cote</span><span className="text-right">Proba</span><span className="text-right">Vol.</span>
                </div>
                {[...history].reverse().slice(0, 7).map((h) => (
                  <div key={h.date} className="grid grid-cols-4 gap-x-2 text-[10px] py-0.5">
                    <span className="text-muted-foreground">{h.date.slice(5)}</span>
                    <span className="text-right font-medium tabular-nums">x{h.odds}</span>
                    <span className="text-right text-destructive tabular-nums">{h.probability}%</span>
                    <span className="text-right text-emerald-600 tabular-nums">{(h.volume / 1000).toFixed(1)}k</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="mt-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">Volume de paris 14j</span>
                <span className="text-sm font-bold text-emerald-600 tabular-nums">
                  {(history.reduce((s, h) => s + h.volume, 0) / 1000).toFixed(0)}k EUR
                </span>
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 8 }} axisLine={false} tickLine={false}
                      tickFormatter={(v: string) => v.slice(8)} />
                    <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={24}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      formatter={(v) => [`${Number(v).toLocaleString()} EUR`, "Volume"]} />
                    <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Meteo detail */}
      <Card>
        <CardContent className="p-3">
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Conditions actuelles
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-bold tabular-nums">{zone.meteo.temp}°C</p>
                <p className="text-[9px] text-muted-foreground">Temperature</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-bold tabular-nums">{zone.meteo.humidity}%</p>
                <p className="text-[9px] text-muted-foreground">Humidite</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Wind className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-bold tabular-nums">{zone.meteo.wind} km/h</p>
                <p className="text-[9px] text-muted-foreground">Vent max</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-cyan-50 rounded-lg">
              <CloudRain className="h-4 w-4 text-cyan-500" />
              <div>
                <p className="text-sm font-bold tabular-nums">{zone.meteo.precipitation} mm</p>
                <p className="text-[9px] text-muted-foreground">Precipitations</p>
              </div>
            </div>
          </div>

          {/* FWI bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> Fire Weather Index</span>
              <span className={`font-bold text-xs ${RISK_BG[zone.riskLevel]} px-1.5 py-0.5 rounded`}>{zone.fwiIndex}/100</span>
            </div>
            <div className="h-2 bg-gradient-to-r from-emerald-300 via-amber-300 via-orange-400 to-red-500 rounded-full overflow-hidden">
              <div className="h-full bg-white/50" style={{ marginLeft: `${zone.fwiIndex}%`, width: `${100 - zone.fwiIndex}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pool info */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-primary tabular-nums">x{zone.odds["7d"]}</p>
              <p className="text-[9px] text-muted-foreground">Cote 7j</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600 tabular-nums">{(zone.pool / 1000).toFixed(1)}k</p>
              <p className="text-[9px] text-muted-foreground">Pool EUR</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground tabular-nums">{zone.activeBets}</p>
              <p className="text-[9px] text-muted-foreground">Paris actifs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
