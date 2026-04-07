"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User, Mail, Wallet, TrendingUp, TrendingDown, Trophy, LogOut,
  Shield, Clock, Flame, Droplets, ChevronRight, Settings,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useWalletStore } from "@/lib/wallet";

export function AccountPanel() {
  const { user, logout } = useAuthStore();
  const wallet = useWalletStore();

  if (!user) return null;

  const activeBets = wallet.bets.filter((b) => b.status === "active");
  const wonBets = wallet.bets.filter((b) => b.status === "won");
  const lostBets = wallet.bets.filter((b) => b.status === "lost");
  const pnl = wallet.getTotalPnL();

  return (
    <ScrollArea className="flex-1">
      <div className="px-3 py-3 space-y-3">
        {/* Profile header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold">{user.displayName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> {user.email}
            </p>
          </div>
          <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-0">Verifie</Badge>
        </div>

        {/* Wallet balance hero */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <Wallet className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-3xl font-extrabold text-primary tabular-nums">{wallet.balance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">EUR disponibles</p>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <p className="text-sm font-bold text-blue-600 tabular-nums">{activeBets.length}</p>
            <p className="text-[8px] text-muted-foreground">Actifs</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
            <p className="text-sm font-bold text-emerald-600 tabular-nums">{wonBets.length}</p>
            <p className="text-[8px] text-muted-foreground">Gagnes</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
            <p className="text-sm font-bold text-red-600 tabular-nums">{lostBets.length}</p>
            <p className="text-[8px] text-muted-foreground">Perdus</p>
          </div>
          <div className={`text-center p-2 rounded-lg ${pnl >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
            <p className={`text-sm font-bold tabular-nums ${pnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {pnl >= 0 ? "+" : ""}{pnl}
            </p>
            <p className="text-[8px] text-muted-foreground">P&L</p>
          </div>
        </div>

        {/* Quick deposit */}
        <Card>
          <CardContent className="p-3">
            <p className="text-xs font-semibold mb-2">Deposer des fonds</p>
            <div className="flex gap-1.5">
              {[100, 500, 1000, 5000].map((v) => (
                <Button key={v} variant="outline" size="sm" className="flex-1 text-xs h-8"
                  onClick={() => wallet.deposit(v)}>
                  +{v}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Recent transactions */}
        <div>
          <p className="text-xs font-semibold mb-2">Dernieres transactions</p>
          <div className="space-y-1">
            {wallet.transactions.slice(-8).reverse().map((tx) => {
              const isPositive = tx.type === "deposit" || tx.type === "bet_won" || tx.type === "bet_refund";
              return (
                <div key={tx.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isPositive ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3 text-emerald-600" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{tx.description}</p>
                    <p className="text-[9px] text-muted-foreground">{new Date(tx.timestamp).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                    {isPositive ? "+" : "-"}{Math.abs(tx.amount)}
                  </span>
                </div>
              );
            })}
            {wallet.transactions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune transaction</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Account info */}
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Securite</span>
              <span className="font-medium text-emerald-600">Email verifie</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Membre depuis</span>
              <span className="font-medium">{new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Wallet</span>
              <span className="font-medium">Simulation EUR</span>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button variant="outline" className="w-full h-10 text-destructive hover:bg-destructive/5" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" /> Se deconnecter
        </Button>
      </div>
    </ScrollArea>
  );
}
