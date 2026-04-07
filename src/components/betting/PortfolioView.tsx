"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Area, AreaChart, Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  TrendingUp, TrendingDown, Trophy, Clock, Flame, Droplets, CloudRain, Wind, FileText,
  ChevronRight, Target, Percent, BarChart3, PieChart, Zap, CalendarDays,
} from "lucide-react";
import { MOCK_BETS, computePortfolioStats, generatePnlHistory, type ExtendedBet } from "@/lib/mock-data";

const catIcons = { fire: Flame, flood: Droplets, rain: CloudRain, storm: Wind, catnat: FileText };
const catColors = {
  fire: "text-red-500 bg-red-50", flood: "text-blue-500 bg-blue-50",
  rain: "text-cyan-500 bg-cyan-50", storm: "text-gray-500 bg-gray-100", catnat: "text-amber-600 bg-amber-50",
};
const statusCfg = {
  active: { label: "Actif", cls: "bg-blue-100 text-blue-700", icon: Clock },
  won: { label: "Gagne", cls: "bg-emerald-100 text-emerald-700", icon: Trophy },
  lost: { label: "Perdu", cls: "bg-red-100 text-red-700", icon: TrendingDown },
  cancelled: { label: "Annule", cls: "bg-gray-100 text-gray-600", icon: Clock },
};

export function PortfolioView() {
  const [selectedBet, setSelectedBet] = useState<ExtendedBet | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const stats = useMemo(() => computePortfolioStats(MOCK_BETS), []);
  const pnlHistory = useMemo(() => generatePnlHistory(60), []);

  const filtered = filter === "all" ? MOCK_BETS
    : filter === "active" ? MOCK_BETS.filter((b) => b.status === "active")
    : MOCK_BETS.filter((b) => b.status === "won" || b.status === "lost");

  // ─── BET DETAIL VIEW ───
  if (selectedBet) {
    const sc = statusCfg[selectedBet.status];
    const Icon = catIcons[selectedBet.category];
    const profit = selectedBet.status === "won" ? selectedBet.potentialGain - selectedBet.amount
      : selectedBet.status === "lost" ? -selectedBet.amount : 0;
    const daysLeft = Math.max(0, Math.ceil((new Date(selectedBet.expiresAt).getTime() - Date.now()) / 86400000));

    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedBet(null)} className="text-xs text-muted-foreground hover:text-foreground">← Retour</button>

        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${catColors[selectedBet.category]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">{selectedBet.zoneName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={`${sc.cls} border-0 text-[9px]`}>{sc.label}</Badge>
              <span className="text-[10px] text-muted-foreground">{selectedBet.horizon} · {selectedBet.betId}</span>
            </div>
          </div>
        </div>

        {/* Stats hero */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2.5 rounded-xl bg-muted/50">
            <p className="text-lg font-extrabold tabular-nums">{selectedBet.amount}</p>
            <p className="text-[9px] text-muted-foreground">Mise EUR</p>
          </div>
          <div className="text-center p-2.5 rounded-xl bg-primary/5">
            <p className="text-lg font-extrabold text-primary tabular-nums">x{selectedBet.odds}</p>
            <p className="text-[9px] text-muted-foreground">Cote entree</p>
          </div>
          <div className={`text-center p-2.5 rounded-xl ${profit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className={`text-lg font-extrabold tabular-nums ${profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {profit >= 0 ? "+" : ""}{profit || selectedBet.potentialGain}
            </p>
            <p className="text-[9px] text-muted-foreground">{selectedBet.status === "active" ? "Potentiel" : "Resultat"}</p>
          </div>
        </div>

        {/* Odds history chart */}
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] font-semibold mb-2">Evolution cote depuis entree</p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedBet.oddsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={28} tickFormatter={(v: number) => `x${v}`} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} formatter={(v) => [`x${v}`, "Cote"]} />
                  <Line type="monotone" dataKey="odds" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardContent className="p-3 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Place le</span><span className="font-medium">{new Date(selectedBet.placedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expire le</span><span className="font-medium">{new Date(selectedBet.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span></div>
            {selectedBet.status === "active" && <div className="flex justify-between"><span className="text-muted-foreground">Jours restants</span><span className="font-bold text-primary">{daysLeft}j</span></div>}
            {selectedBet.resolutionSource && <div className="flex justify-between"><span className="text-muted-foreground">Source resolution</span><span className="font-medium text-primary">{selectedBet.resolutionSource}</span></div>}
            {selectedBet.marketId && <div className="flex justify-between"><span className="text-muted-foreground">Marche</span><span className="font-medium">{selectedBet.marketId}</span></div>}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── PORTFOLIO LIST VIEW ───
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Portfolio</h3>
        <Badge variant="outline" className="text-[9px]">{stats.totalBets} paris</Badge>
      </div>

      {/* P&L hero */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`relative overflow-hidden rounded-xl p-3 text-center ${stats.pnl >= 0 ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5" : "bg-gradient-to-br from-red-500/10 to-red-500/5"}`}>
          <Zap className={`absolute -top-1 -right-1 h-8 w-8 ${stats.pnl >= 0 ? "text-emerald-500/10" : "text-red-500/10"}`} />
          <p className={`text-2xl font-extrabold tabular-nums ${stats.pnl >= 0 ? "text-emerald-600" : "text-destructive"}`}>
            {stats.pnl >= 0 ? "+" : ""}{stats.pnl}
          </p>
          <p className="text-[9px] text-muted-foreground">P&L EUR</p>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-center">
          <Percent className="absolute -top-1 -right-1 h-8 w-8 text-primary/10" />
          <p className="text-2xl font-extrabold text-primary tabular-nums">{stats.roi}%</p>
          <p className="text-[9px] text-muted-foreground">ROI</p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-5 gap-1">
        {[
          { v: stats.activeBets, l: "Actifs", c: "text-blue-600 bg-blue-50" },
          { v: stats.wonBets, l: "Gagnes", c: "text-emerald-600 bg-emerald-50" },
          { v: stats.lostBets, l: "Perdus", c: "text-red-600 bg-red-50" },
          { v: `${stats.winRate}%`, l: "Win", c: "text-primary bg-primary/5" },
          { v: `x${stats.avgOdds}`, l: "Moy.", c: "text-foreground bg-muted/50" },
        ].map((s) => (
          <div key={s.l} className={`text-center p-1.5 rounded-lg ${s.c}`}>
            <p className="text-sm font-bold tabular-nums">{s.v}</p>
            <p className="text-[7px] text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="flex gap-1">
        {(Object.entries(stats.byCategory) as [keyof typeof catIcons, number][]).filter(([, v]) => v > 0).map(([cat, count]) => {
          const CI = catIcons[cat];
          return (
            <div key={cat} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${catColors[cat]}`}>
              <CI className="h-3 w-3" /> {count}
            </div>
          );
        })}
      </div>

      {/* P&L Chart */}
      <Tabs defaultValue="pnl">
        <TabsList className="w-full h-7">
          <TabsTrigger value="pnl" className="flex-1 text-[10px]"><BarChart3 className="h-2.5 w-2.5 mr-1" />P&L 60j</TabsTrigger>
          <TabsTrigger value="exposure" className="flex-1 text-[10px]"><PieChart className="h-2.5 w-2.5 mr-1" />Exposition</TabsTrigger>
        </TabsList>
        <TabsContent value="pnl" className="mt-1.5">
          <Card>
            <CardContent className="p-2.5">
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pnlHistory}>
                    <defs>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 7 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} formatter={(v) => [`${Number(v) > 0 ? "+" : ""}${v} EUR`, "P&L"]} />
                    <Area type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={1.5} fill="url(#pg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="exposure" className="mt-1.5">
          <Card>
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Exposition active</span><span className="font-bold">{stats.activeExposure} EUR</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total investi</span><span className="font-medium">{stats.totalInvested} EUR</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Plus gros gain</span><span className="font-medium text-emerald-600">+{stats.biggestWin} EUR</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Plus grosse perte</span><span className="font-medium text-destructive">-{stats.biggestLoss} EUR</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Filter tabs */}
      <div className="flex gap-1">
        {(["all", "active", "resolved"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${filter === f ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground"}`}>
            {f === "all" ? `Tous (${MOCK_BETS.length})` : f === "active" ? `Actifs (${stats.activeBets})` : `Resolus (${stats.wonBets + stats.lostBets})`}
          </button>
        ))}
      </div>

      {/* Bet list */}
      <div className="space-y-2">
        {filtered.map((bet) => {
          const sc = statusCfg[bet.status];
          const Icon = catIcons[bet.category];
          const profit = bet.status === "won" ? bet.potentialGain - bet.amount : bet.status === "lost" ? -bet.amount : 0;
          return (
            <Card key={bet.betId} className={`cursor-pointer active:scale-[0.99] transition-all ${bet.status === "active" ? "border-blue-200/50" : ""}`}
              onClick={() => setSelectedBet(bet)}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${catColors[bet.category]}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate">{bet.zoneName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={`${sc.cls} border-0 text-[8px] px-1 py-0 h-3.5`}>{sc.label}</Badge>
                      <span className="text-[9px] text-muted-foreground">{bet.horizon} · x{bet.odds}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${profit > 0 ? "text-emerald-600" : profit < 0 ? "text-destructive" : "text-foreground"}`}>
                      {profit > 0 ? "+" : ""}{profit || bet.potentialGain}
                    </p>
                    <p className="text-[9px] text-muted-foreground tabular-nums">{bet.amount} EUR</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
