"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  TrendingUp, TrendingDown, Trophy, XCircle, Clock, DollarSign,
  Percent, BarChart3, Flame,
} from "lucide-react";
import { MOCK_BETS, computePortfolioStats, generatePnlHistory } from "@/lib/mock-data";

const statusConfig = {
  active: { label: "Actif", className: "bg-blue-100 text-blue-700" },
  won: { label: "Gagne", className: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Perdu", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Annule", className: "bg-gray-100 text-gray-700" },
};

export function PortfolioView() {
  const stats = useMemo(() => computePortfolioStats(MOCK_BETS), []);
  const pnlHistory = useMemo(() => generatePnlHistory(30), []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Portfolio</h3>
        <Badge variant="outline" className="text-[9px]">Demo</Badge>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className={`text-xl font-bold tabular-nums ${stats.pnl >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {stats.pnl >= 0 ? "+" : ""}{stats.pnl} EUR
            </p>
            <p className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
              {stats.pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              P&L Total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold tabular-nums text-primary">{stats.roi}%</p>
            <p className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
              <Percent className="h-3 w-3" /> ROI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-1.5">
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <p className="text-sm font-bold tabular-nums">{stats.totalBets}</p>
          <p className="text-[8px] text-muted-foreground">Total</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-sm font-bold text-blue-600 tabular-nums">{stats.activeBets}</p>
          <p className="text-[8px] text-muted-foreground">Actifs</p>
        </div>
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <p className="text-sm font-bold text-emerald-600 tabular-nums">{stats.wonBets}</p>
          <p className="text-[8px] text-muted-foreground">Gagnes</p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <p className="text-sm font-bold text-red-600 tabular-nums">{stats.lostBets}</p>
          <p className="text-[8px] text-muted-foreground">Perdus</p>
        </div>
      </div>

      {/* Win rate + exposure */}
      <Card>
        <CardContent className="p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Trophy className="h-3 w-3" /> Win Rate
            </span>
            <span className="text-sm font-bold text-primary tabular-nums">{stats.winRate}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.winRate}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-2">
            <span>Exposition: <strong>{stats.activeExposure} EUR</strong></span>
            <span>Investi total: <strong>{stats.totalInvested} EUR</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* P&L Chart */}
      <Card>
        <CardContent className="p-3">
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <BarChart3 className="h-3 w-3" /> P&L cumulatif 30j
          </p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlHistory}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="#10B981" stopOpacity={0} />
                    <stop offset="51%" stopColor="#EF4444" stopOpacity={0} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 8 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: string) => v.slice(8)} />
                <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={30}
                  tickFormatter={(v: number) => `${v}`} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v) => [`${Number(v) > 0 ? "+" : ""}${v} EUR`, "P&L"]} />
                <Area type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={2} fill="url(#pnlGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Bets list */}
      <p className="text-xs font-semibold">Historique des paris</p>
      <div className="space-y-2">
        {MOCK_BETS.map((bet) => {
          const sc = statusConfig[bet.status];
          return (
            <Card key={bet.betId} className={bet.status === "active" ? "border-blue-200" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Flame className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <span className="text-xs font-semibold truncate">{bet.zoneName}</span>
                  </div>
                  <Badge variant="outline" className={`${sc.className} border-0 text-[9px]`}>{sc.label}</Badge>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center mt-2">
                  <div>
                    <p className="text-[11px] font-bold tabular-nums">{bet.amount} EUR</p>
                    <p className="text-[8px] text-muted-foreground">Mise</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-primary tabular-nums">x{bet.odds}</p>
                    <p className="text-[8px] text-muted-foreground">Cote</p>
                  </div>
                  <div>
                    <p className={`text-[11px] font-bold tabular-nums ${bet.status === "won" ? "text-emerald-600" : bet.status === "lost" ? "text-destructive" : "text-foreground"}`}>
                      {bet.status === "won" ? `+${bet.potentialGain - bet.amount}` : bet.status === "lost" ? `-${bet.amount}` : bet.potentialGain} EUR
                    </p>
                    <p className="text-[8px] text-muted-foreground">{bet.status === "active" ? "Potentiel" : "Resultat"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tabular-nums">{bet.horizon}</p>
                    <p className="text-[8px] text-muted-foreground">{bet.placedAt.slice(5, 10)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
