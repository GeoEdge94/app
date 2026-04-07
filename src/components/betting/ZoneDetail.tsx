"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskBadge } from "@/components/shared/RiskBadge";
import {
  Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Flame, Thermometer, Droplets, Wind, CloudRain, TrendingUp, TrendingDown,
  Target, BarChart3, ChevronLeft, Zap, Clock, Users, Coins,
} from "lucide-react";
import { generateOddsHistory } from "@/lib/mock-data";
import { RISK_BG } from "@/lib/risk-colors";
import type { BettingZone } from "@/types";

interface ZoneDetailProps {
  zone: BettingZone;
  onBack: () => void;
  onBet: () => void;
}

export function ZoneDetail({ zone, onBack, onBet }: ZoneDetailProps) {
  const history = useMemo(() => generateOddsHistory(zone.odds["7d"], 14), [zone.odds]);
  const latest = history[history.length - 1];
  const prev = history[history.length - 2];
  const trend = latest.odds - prev.odds;
  const totalVol = history.reduce((s, h) => s + h.volume, 0);

  return (
    <div className="space-y-3 pb-2">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="mt-0.5 p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold truncate">{zone.name}</h3>
            <RiskBadge level={zone.riskLevel} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{zone.department} — {zone.vegetation}</p>
        </div>
      </div>

      {/* Hero stats — glassmorphism */}
      <div className="grid grid-cols-3 gap-2">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-center">
          <Zap className="absolute -top-1 -right-1 h-8 w-8 text-primary/10" />
          <p className="text-2xl font-extrabold text-primary tabular-nums">x{zone.odds["7d"]}</p>
          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Cote 7j</p>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 p-3 text-center">
          <Target className="absolute -top-1 -right-1 h-8 w-8 text-destructive/10" />
          <p className="text-2xl font-extrabold text-destructive tabular-nums">{Math.round(zone.probability["7d"] * 100)}%</p>
          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Proba 7j</p>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-3 text-center">
          <Coins className="absolute -top-1 -right-1 h-8 w-8 text-emerald-500/10" />
          <p className="text-2xl font-extrabold text-emerald-600 tabular-nums">{(zone.pool / 1000).toFixed(0)}k</p>
          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Pool EUR</p>
        </div>
      </div>

      {/* Probability gauge */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-amber-400 via-orange-400 to-red-500">
          <div className="h-full bg-white/60 transition-all duration-700" style={{ marginLeft: `${zone.probability["7d"] * 100}%`, width: `${100 - zone.probability["7d"] * 100}%` }} />
        </div>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-destructive" /> Indice FWI
            </span>
            <span className={`text-xs font-bold ${RISK_BG[zone.riskLevel]} px-2 py-0.5 rounded-full`}>{zone.fwiIndex}/100</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "7 jours", value: zone.probability["7d"], color: "text-destructive" },
              { label: "30 jours", value: zone.probability["30d"], color: "text-orange-600" },
              { label: "Saison", value: 0.96, color: "text-amber-600" },
            ].map((h) => (
              <div key={h.label} className="text-center p-1.5 rounded-lg bg-muted/40">
                <p className={`text-sm font-bold tabular-nums ${h.color}`}>{Math.round(h.value * 100)}%</p>
                <p className="text-[8px] text-muted-foreground">{h.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts tabs */}
      <Tabs defaultValue="odds" className="w-full">
        <TabsList className="w-full h-8">
          <TabsTrigger value="odds" className="flex-1 text-[11px] gap-1"><TrendingUp className="h-3 w-3" /> Cotes</TabsTrigger>
          <TabsTrigger value="volume" className="flex-1 text-[11px] gap-1"><BarChart3 className="h-3 w-3" /> Volume</TabsTrigger>
        </TabsList>

        <TabsContent value="odds" className="mt-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-muted-foreground">14 derniers jours</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-primary tabular-nums">x{latest.odds}</span>
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${trend < 0 ? "text-destructive" : "text-emerald-600"}`}>
                    {trend < 0 ? <TrendingDown className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
                    {trend > 0 ? "+" : ""}{trend.toFixed(2)}
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
                    <XAxis dataKey="date" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={28} tickFormatter={(v: number) => `x${v}`} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`x${v}`, "Cote"]} labelFormatter={(l) => `${l}`} />
                    <Area type="monotone" dataKey="odds" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#ogr)" dot={{ r: 2, fill: "hsl(var(--primary))" }} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Compact date table */}
              <div className="mt-2 space-y-px max-h-20 overflow-y-auto scrollbar-hide">
                {[...history].reverse().slice(0, 5).map((h) => (
                  <div key={h.date} className="flex items-center justify-between text-[10px] py-1 px-1 rounded hover:bg-muted/50">
                    <span className="text-muted-foreground w-16">{h.date}</span>
                    <span className="font-semibold text-primary tabular-nums">x{h.odds}</span>
                    <span className="text-destructive tabular-nums">{h.probability}%</span>
                    <span className="text-emerald-600 tabular-nums">{(h.volume / 1000).toFixed(1)}k</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="mt-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Volume de paris</span>
                <span className="text-sm font-bold text-emerald-600 tabular-nums">{(totalVol / 1000).toFixed(0)}k EUR</span>
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.slice(8)} />
                    <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={24} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${Number(v).toLocaleString()} EUR`, "Volume"]} />
                    <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Meteo grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { icon: Thermometer, value: `${zone.meteo.temp}°`, label: "Temp", color: "text-orange-500", bg: "bg-orange-50" },
          { icon: Droplets, value: `${zone.meteo.humidity}%`, label: "Humid", color: "text-blue-500", bg: "bg-blue-50" },
          { icon: Wind, value: `${zone.meteo.wind}`, label: "km/h", color: "text-gray-500", bg: "bg-gray-50" },
          { icon: CloudRain, value: `${zone.meteo.precipitation}`, label: "mm", color: "text-cyan-500", bg: "bg-cyan-50" },
        ].map((m) => (
          <div key={m.label} className={`${m.bg} rounded-xl p-2 text-center`}>
            <m.icon className={`h-3.5 w-3.5 mx-auto ${m.color}`} />
            <p className="text-sm font-bold tabular-nums mt-0.5">{m.value}</p>
            <p className="text-[8px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Pool bar */}
      <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1"><Users className="h-3 w-3" /><span className="font-medium text-foreground">{zone.activeBets}</span> paris</div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Mise a jour il y a 12min</div>
      </div>

      {/* CTA */}
      <button
        onClick={onBet}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
      >
        <TrendingUp className="h-4 w-4" />
        Parier sur {zone.name}
      </button>
    </div>
  );
}
