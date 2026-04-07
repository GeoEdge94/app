"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/lib/wallet";
import { startOraclePolling } from "@/lib/oracle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Clock,
  Trophy,
  XCircle,
  RotateCcw,
  Activity,
} from "lucide-react";
import type { TransactionType } from "@/lib/wallet";

// ── Transaction icon / color map ───────────────────────────────────

const TX_META: Record<TransactionType, { icon: typeof Wallet; color: string; sign: string }> = {
  deposit:    { icon: ArrowDownCircle,    color: "text-emerald-600", sign: "+" },
  withdraw:   { icon: ArrowUpCircle,      color: "text-red-500",    sign: "-" },
  bet_placed: { icon: CircleDollarSign,   color: "text-blue-500",   sign: "-" },
  bet_won:    { icon: Trophy,             color: "text-emerald-600", sign: "+" },
  bet_lost:   { icon: XCircle,            color: "text-red-500",    sign: "" },
  bet_refund: { icon: RotateCcw,          color: "text-amber-500",  sign: "+" },
};

const QUICK_DEPOSITS = [100, 500, 1_000, 5_000] as const;

// ── Helpers ────────────────────────────────────────────────────────

function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1_000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Component ──────────────────────────────────────────────────────

export function WalletPanel() {
  const balance = useWalletStore((s) => s.balance);
  const transactions = useWalletStore((s) => s.transactions);
  const bets = useWalletStore((s) => s.bets);
  const deposit = useWalletStore((s) => s.deposit);
  const getActiveBets = useWalletStore((s) => s.getActiveBets);
  const getTotalPnL = useWalletStore((s) => s.getTotalPnL);

  // Start oracle polling on mount
  useEffect(() => {
    const stop = startOraclePolling(30_000);
    return stop;
  }, []);

  const activeBets = getActiveBets();
  const totalExposure = activeBets.reduce((sum, b) => sum + b.amount, 0);
  const pnl = getTotalPnL();
  const pnlPositive = pnl >= 0;

  return (
    <Card className="w-full">
      {/* ── Header: balance ─────────────────────────────────── */}
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <CardTitle>Wallet</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Balance display */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Balance</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {formatEur(balance)}{" "}
            <span className="text-base font-medium text-muted-foreground">EUR</span>
          </p>
        </div>

        {/* Quick deposit buttons */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_DEPOSITS.map((amt) => (
            <Button
              key={amt}
              variant="outline"
              size="sm"
              className="text-xs tabular-nums"
              onClick={() => deposit(amt)}
            >
              +{amt}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {/* Active bets */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <Activity className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-lg font-bold tabular-nums">{activeBets.length}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Active bets</p>
          </div>

          {/* Exposure */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-lg font-bold tabular-nums">{formatEur(totalExposure)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Exposure</p>
          </div>

          {/* P&L */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              {pnlPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={`text-lg font-bold tabular-nums ${
                  pnlPositive ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {pnlPositive ? "+" : ""}
                {formatEur(pnl)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Total P&L</p>
          </div>
        </div>

        <Separator />

        {/* Transaction history */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Transaction history
          </p>

          {transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No transactions yet. Place a bet or deposit funds to get started.
            </p>
          ) : (
            <ScrollArea className="h-[260px]">
              <div className="space-y-1 pr-3">
                {transactions.map((tx) => {
                  const meta = TX_META[tx.type];
                  const Icon = meta.icon;
                  const isPositive = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className={`shrink-0 ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground">{relativeTime(tx.timestamp)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            isPositive ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {formatEur(tx.amount)} EUR
                        </span>
                        {tx.betId && (
                          <Badge variant="outline" className="ml-1.5 text-[9px] py-0 px-1">
                            bet
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
