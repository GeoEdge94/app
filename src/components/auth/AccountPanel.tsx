"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Mail, Wallet, TrendingUp, TrendingDown, Trophy, LogOut,
  Shield, Clock, Flame, Droplets, Crown, Zap, Rocket, Banknote,
  LayoutGrid, Target, BarChart3, Award, Eye, Bell,
  ChevronRight, ArrowUpRight, ArrowDownRight, Percent,
  Crosshair, Activity, MessageCircle, MapPin,
  Thermometer, Mountain, Wind,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useWalletStore } from "@/lib/wallet";
import {
  DEMO_PROFILE,
  DEMO_TRANSACTIONS,
  DEMO_BETS,
  TIER_CONFIG,
  CATEGORY_CONFIG,
  isDemoUser,
  type DemoTransaction,
  type DemoBet,
} from "@/lib/demo-profile";

// ── Category icon mapper ──────────────────────────────────────────

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  switch (category) {
    case "fire": return <Flame className={className} />;
    case "temperature": return <Thermometer className={className} />;
    case "flood": return <Droplets className={className} />;
    case "earthquake": return <Mountain className={className} />;
    case "tornado": return <Wind className={className} />;
    default: return <Activity className={className} />;
  }
}

// ── Achievement icon mapper ───────────────────────────────────────

function AchievementIcon({ id, className }: { id: string; className?: string }) {
  switch (id) {
    case "first-bet": return <Rocket className={className} />;
    case "streak-5": return <Zap className={className} />;
    case "profit-1k": return <Banknote className={className} />;
    case "fire-expert": return <Flame className={className} />;
    case "diversified": return <LayoutGrid className={className} />;
    default: return <Award className={className} />;
  }
}

// ── Win Rate Gauge ────────────────────────────────────────────────

function WinRateGauge({ rate }: { rate: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const filled = (rate / 100) * circumference;
  const color = rate >= 70 ? "#10b981" : rate >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor"
          strokeWidth="6" className="text-muted/20" />
        <circle cx="40" cy="40" r={radius} fill="none" stroke={color}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference - filled} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold tabular-nums">{rate}%</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">Win rate</span>
      </div>
    </div>
  );
}

// ── Bet Status Badge ──────────────────────────────────────────────

function BetStatusBadge({ status }: { status: DemoBet["status"] }) {
  const config = {
    won: { label: "Gagne", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    lost: { label: "Perdu", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    active: { label: "Actif", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    expired: { label: "Expire", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}

// ── Main AccountPanel ─────────────────────────────────────────────

export function AccountPanel() {
  const { user, logout } = useAuthStore();
  const wallet = useWalletStore();
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [notifs, setNotifs] = useState(DEMO_PROFILE.notifications);

  if (!user) return null;

  const isDemo = isDemoUser(user.email);
  const profile = isDemo ? DEMO_PROFILE : null;

  // Fallback to old behavior for non-demo users
  if (!profile) {
    return <FallbackAccountPanel />;
  }

  const tierCfg = TIER_CONFIG[profile.tier];
  const sortedTransactions = [...DEMO_TRANSACTIONS].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const sortedBets = [...DEMO_BETS].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );

  return (
    <ScrollArea className="flex-1 h-full overflow-auto">
      <div className="px-3 py-3 space-y-3">

        {/* ── Profile Header ─────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
            <span className="text-sm font-bold text-white">{profile.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold">{profile.displayName}</p>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${tierCfg.bg} ${tierCfg.color}`}>
                <Crown className="h-2.5 w-2.5" />
                {tierCfg.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> {profile.email}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5" />
              Membre depuis {new Date(profile.memberSince).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* ── Balance Hero ────────────────────────────────────── */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="text-center">
              <Wallet className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-3xl font-extrabold text-primary tabular-nums">
                {profile.balance.toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-muted-foreground">EUR disponibles</p>
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-primary/10">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Depose</p>
                <p className="text-sm font-semibold text-emerald-600 tabular-nums flex items-center justify-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />
                  {profile.totalDeposited.toLocaleString("fr-FR")}
                </p>
              </div>
              <Separator orientation="vertical" className="h-8 mx-2" />
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Retire</p>
                <p className="text-sm font-semibold text-red-500 tabular-nums flex items-center justify-center gap-0.5">
                  <ArrowDownRight className="h-3 w-3" />
                  {profile.totalWithdrawn.toLocaleString("fr-FR")}
                </p>
              </div>
              <Separator orientation="vertical" className="h-8 mx-2" />
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">P&L</p>
                <p className={`text-sm font-semibold tabular-nums flex items-center justify-center gap-0.5 ${profile.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  <TrendingUp className="h-3 w-3" />
                  +{profile.pnl.toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Win Rate + Quick Stats ──────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardContent className="p-3">
              <WinRateGauge rate={profile.winRate} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Total paris</span>
                <span className="text-xs font-bold tabular-nums">{profile.totalBets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">ROI</span>
                <span className="text-xs font-bold text-emerald-600 tabular-nums">+{profile.roi}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Serie max</span>
                <span className="text-xs font-bold tabular-nums flex items-center gap-0.5">
                  <Zap className="h-2.5 w-2.5 text-amber-500" />{profile.bestStreak}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Serie actuelle</span>
                <span className="text-xs font-bold tabular-nums">{profile.currentStreak}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Cote moyenne</span>
                <span className="text-xs font-bold tabular-nums">{profile.avgOdds.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Stats Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <p className="text-sm font-bold text-blue-600 tabular-nums">{profile.activeBets}</p>
            <p className="text-[8px] text-muted-foreground">Actifs</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
            <p className="text-sm font-bold text-emerald-600 tabular-nums">{profile.wonBets}</p>
            <p className="text-[8px] text-muted-foreground">Gagnes</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
            <p className="text-sm font-bold text-red-600 tabular-nums">{profile.lostBets}</p>
            <p className="text-[8px] text-muted-foreground">Perdus</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <p className="text-sm font-bold text-amber-600 tabular-nums">{profile.expiredBets}</p>
            <p className="text-[8px] text-muted-foreground">Expires</p>
          </div>
        </div>

        {/* ── Biggest Win / Loss ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[9px] text-muted-foreground">Meilleur gain</p>
              <p className="text-sm font-bold text-emerald-600 tabular-nums">+{profile.biggestWin.toLocaleString("fr-FR")} EUR</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20">
            <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
            <div>
              <p className="text-[9px] text-muted-foreground">Plus grosse perte</p>
              <p className="text-sm font-bold text-red-500 tabular-nums">-{profile.biggestLoss.toLocaleString("fr-FR")} EUR</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Category Breakdown ───────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" /> Performance par categorie
          </p>
          <div className="space-y-1.5">
            {Object.entries(profile.categoryStats).map(([key, stat]) => {
              const cfg = CATEGORY_CONFIG[key] || { label: key, color: "text-gray-600", bg: "bg-gray-50" };
              const winRate = stat.bets > 0 ? Math.round((stat.wins / stat.bets) * 100) : 0;
              return (
                <div key={key} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${cfg.bg} dark:bg-muted/30`}>
                  <CategoryIcon category={key} className={`h-3.5 w-3.5 ${cfg.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground">{stat.bets} paris</span>
                        <span className="text-[9px] text-muted-foreground">{winRate}% WR</span>
                        <span className={`text-[10px] font-bold tabular-nums ${stat.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {stat.pnl >= 0 ? "+" : ""}{stat.pnl.toLocaleString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    {/* Mini progress bar */}
                    <div className="w-full h-1 bg-black/5 dark:bg-white/5 rounded-full mt-1">
                      <div
                        className={`h-full rounded-full transition-all ${stat.pnl >= 0 ? "bg-emerald-500" : "bg-red-400"}`}
                        style={{ width: `${winRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* ── Achievements ─────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> Succes ({profile.achievements.length})
          </p>
          <div className="space-y-1.5">
            {(showAllAchievements ? profile.achievements : profile.achievements.slice(0, 3)).map((ach) => (
              <div key={ach.id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-gradient-to-r from-amber-50/80 to-transparent dark:from-amber-900/10 border border-amber-200/40 dark:border-amber-800/20">
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <AchievementIcon id={ach.id} className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold">{ach.name}</p>
                  <p className="text-[9px] text-muted-foreground">{ach.description}</p>
                </div>
                <span className="text-[8px] text-muted-foreground shrink-0">
                  {new Date(ach.unlockedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
          {profile.achievements.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1.5 h-7 text-[10px] text-primary"
              onClick={() => setShowAllAchievements(!showAllAchievements)}
            >
              {showAllAchievements ? "Masquer" : `Voir les ${profile.achievements.length} succes`}
              <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${showAllAchievements ? "rotate-90" : ""}`} />
            </Button>
          )}
        </div>

        <Separator />

        {/* ── Watched Zones ────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> Zones surveillees
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.watchedZones.map((zone) => (
              <span key={zone}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-[10px] font-medium">
                <MapPin className="h-2.5 w-2.5 text-primary" />
                {zone}
              </span>
            ))}
          </div>
        </div>

        <Separator />

        {/* ── Tabs: Bet History / Transactions ─────────────────── */}
        <Tabs defaultValue="bets">
          <TabsList className="w-full">
            <TabsTrigger value="bets" className="flex-1 text-[10px] gap-1">
              <Target className="h-3 w-3" /> Paris ({DEMO_BETS.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 text-[10px] gap-1">
              <Activity className="h-3 w-3" /> Transactions ({DEMO_TRANSACTIONS.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Bet History Tab ─────────────────────────────────── */}
          <TabsContent value="bets">
            <div className="space-y-2 mt-2">
              {sortedBets.map((bet) => (
                <Card key={bet.betId} className="overflow-hidden">
                  <CardContent className="p-2.5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold leading-tight">{bet.marketTitle}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] text-muted-foreground">{bet.platform}</span>
                          <span className="text-[8px] text-muted-foreground">-</span>
                          <CategoryIcon category={bet.category} className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[8px] text-muted-foreground capitalize">
                            {CATEGORY_CONFIG[bet.category]?.label || bet.category}
                          </span>
                        </div>
                      </div>
                      <BetStatusBadge status={bet.status} />
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-1 text-center py-1.5 bg-muted/30 rounded-md">
                      <div>
                        <p className="text-[8px] text-muted-foreground">Mise</p>
                        <p className="text-[10px] font-bold tabular-nums">{bet.amount}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground">Cote</p>
                        <p className="text-[10px] font-bold tabular-nums">{bet.odds.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground">Gain pot.</p>
                        <p className="text-[10px] font-bold tabular-nums">{bet.potentialPayout.toLocaleString("fr-FR")}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground">P&L</p>
                        <p className={`text-[10px] font-bold tabular-nums ${bet.pnl > 0 ? "text-emerald-600" : bet.pnl < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                          {bet.pnl > 0 ? "+" : ""}{bet.pnl !== 0 ? bet.pnl.toLocaleString("fr-FR") : "--"}
                        </p>
                      </div>
                    </div>

                    {/* Resolution text */}
                    {bet.resolution && (
                      <div className="mt-1.5 px-2 py-1.5 rounded bg-muted/50 border-l-2 border-primary/30">
                        <p className="text-[9px] text-muted-foreground leading-relaxed">{bet.resolution}</p>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex justify-between mt-1.5 text-[8px] text-muted-foreground">
                      <span>Place le {new Date(bet.placedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {bet.resolvedAt && (
                        <span>Resolu le {new Date(bet.resolvedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Transactions Tab ───────────────────────────────── */}
          <TabsContent value="transactions">
            <div className="space-y-0.5 mt-2">
              {sortedTransactions.map((tx) => {
                const isPositive = tx.type === "deposit" || tx.type === "bet_won" || tx.type === "bet_refund";
                return (
                  <div key={tx.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isPositive ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      {tx.type === "deposit" && <ArrowUpRight className="h-3 w-3 text-emerald-600" />}
                      {tx.type === "withdraw" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                      {tx.type === "bet_placed" && <Target className="h-3 w-3 text-red-500" />}
                      {tx.type === "bet_won" && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                      {tx.type === "bet_lost" && <TrendingDown className="h-3 w-3 text-red-500" />}
                      {tx.type === "bet_refund" && <ArrowUpRight className="h-3 w-3 text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium truncate">{tx.description}</p>
                      <p className="text-[8px] text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        {" "}
                        {new Date(tx.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`text-[11px] font-bold tabular-nums shrink-0 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("fr-FR")}
                    </span>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* ── Notification Preferences ─────────────────────────── */}
        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </p>
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[11px] font-medium">Telegram</span>
                </div>
                <Switch
                  checked={notifs.telegram}
                  onCheckedChange={(val: boolean) => setNotifs((n) => ({ ...n, telegram: val }))}
                  size="sm"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-[11px] font-medium">Email</span>
                </div>
                <Switch
                  checked={notifs.email}
                  onCheckedChange={(val: boolean) => setNotifs((n) => ({ ...n, email: val }))}
                  size="sm"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-[11px] font-medium">Push</span>
                </div>
                <Switch
                  checked={notifs.push}
                  onCheckedChange={(val: boolean) => setNotifs((n) => ({ ...n, push: val }))}
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* ── Account Info ─────────────────────────────────────── */}
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Securite</span>
              <span className="font-medium text-emerald-600">Email verifie</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Membre depuis</span>
              <span className="font-medium">
                {new Date(profile.memberSince).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Wallet</span>
              <span className="font-medium">Simulation EUR</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Quick Deposit ────────────────────────────────────── */}
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

        {/* ── Logout ───────────────────────────────────────────── */}
        <Button variant="outline" className="w-full h-10 text-destructive hover:bg-destructive/5" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" /> Se deconnecter
        </Button>
      </div>
    </ScrollArea>
  );
}

// ── Fallback for non-demo users ───────────────────────────────────

function FallbackAccountPanel() {
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
