"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft, ExternalLink, Clock, Users, TrendingUp, Shield,
  Droplets, CloudRain, Wind, Flame, FileText, CheckCircle, XCircle,
} from "lucide-react";
import type { PredictionMarket, MarketCategory } from "@/lib/markets-data";

const catIcons: Record<MarketCategory, typeof Flame> = {
  flood: Droplets, rain: CloudRain, storm: Wind, fire: Flame, catnat: FileText,
};
const catLabels: Record<MarketCategory, string> = {
  flood: "Inondation / Crue", rain: "Pluie / Orage", storm: "Tempete / Vent",
  fire: "Feu de foret", catnat: "Cat Nat / Secheresse",
};

export function MarketDetail({ market, onBack }: { market: PredictionMarket; onBack: () => void }) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState(50);
  const Icon = catIcons[market.category];
  const yesPercent = Math.round(market.yesPrice * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(market.deadline).getTime() - Date.now()) / 86400000));
  const payout = side === "yes"
    ? Math.round(amount / market.yesPrice)
    : Math.round(amount / market.noPrice);
  const profit = payout - amount;

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
      <div className="flex items-start gap-2">
        <button onClick={onBack} className="mt-0.5 p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-medium">{catLabels[market.category]}</span>
          </div>
          <h3 className="text-sm font-bold leading-tight">{market.title}</h3>
        </div>
      </div>

      {/* Probability hero */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide("yes")}
          className={`rounded-xl p-3 text-center transition-all ${side === "yes" ? "ring-2 ring-emerald-500 bg-emerald-50" : "bg-muted/50 hover:bg-muted"}`}
        >
          <CheckCircle className={`h-5 w-5 mx-auto mb-1 ${side === "yes" ? "text-emerald-500" : "text-muted-foreground"}`} />
          <p className="text-2xl font-extrabold text-emerald-600 tabular-nums">{yesPercent}%</p>
          <p className="text-[10px] text-muted-foreground font-medium">Oui — 0.{yesPercent.toString().padStart(2, "0")} EUR</p>
        </button>
        <button
          onClick={() => setSide("no")}
          className={`rounded-xl p-3 text-center transition-all ${side === "no" ? "ring-2 ring-red-500 bg-red-50" : "bg-muted/50 hover:bg-muted"}`}
        >
          <XCircle className={`h-5 w-5 mx-auto mb-1 ${side === "no" ? "text-red-500" : "text-muted-foreground"}`} />
          <p className="text-2xl font-extrabold text-red-500 tabular-nums">{100 - yesPercent}%</p>
          <p className="text-[10px] text-muted-foreground font-medium">Non — 0.{(100 - yesPercent).toString().padStart(2, "0")} EUR</p>
        </button>
      </div>

      {/* Bet form */}
      <Card className={side === "yes" ? "border-emerald-200" : "border-red-200"}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
              className="h-9 text-sm font-semibold tabular-nums"
              min={1}
            />
            <span className="text-xs text-muted-foreground shrink-0">EUR</span>
          </div>
          <div className="flex gap-1.5">
            {[10, 25, 50, 100, 250].map((v) => (
              <button key={v} onClick={() => setAmount(v)}
                className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-colors ${amount === v ? "bg-foreground text-background" : "bg-muted hover:bg-accent"}`}>
                {v}
              </button>
            ))}
          </div>
          <Separator />
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Position</span>
              <span className="font-medium">{side === "yes" ? "Oui" : "Non"} — {amount} EUR</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Prix par part</span>
              <span className="font-medium tabular-nums">{side === "yes" ? market.yesPrice.toFixed(2) : market.noPrice.toFixed(2)} EUR</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Parts acquises</span>
              <span className="font-medium tabular-nums">{Math.floor(amount / (side === "yes" ? market.yesPrice : market.noPrice))}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Gain si {side === "yes" ? "Oui" : "Non"}</span>
              <span className={side === "yes" ? "text-emerald-600" : "text-red-500"}>+{profit} EUR</span>
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Retour total</span>
              <span className="font-medium tabular-nums">{payout} EUR</span>
            </div>
          </div>
          <Button className={`w-full h-10 font-semibold ${side === "yes" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"}`}>
            Acheter {side === "yes" ? "Oui" : "Non"} — {amount} EUR
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <p className="text-sm font-bold tabular-nums">{(market.volume / 1000).toFixed(1)}k</p>
          <p className="text-[8px] text-muted-foreground">Volume EUR</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <p className="text-sm font-bold tabular-nums">{market.participants}</p>
          <p className="text-[8px] text-muted-foreground">Participants</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <p className="text-sm font-bold tabular-nums">{daysLeft}j</p>
          <p className="text-[8px] text-muted-foreground">Restants</p>
        </div>
      </div>

      {/* Resolution rule */}
      <Card>
        <CardContent className="p-3">
          <p className="text-[11px] font-semibold flex items-center gap-1.5 mb-2">
            <Shield className="h-3.5 w-3.5 text-primary" /> Regle de resolution
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{market.resolutionRule}</p>
          <Separator className="my-2" />
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Source primaire</span>
              <a href={market.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="font-medium text-primary flex items-center gap-0.5 hover:underline">
                {market.sourcePrimary.split(" — ")[0]} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Echeance</span>
              <span className="font-medium">{new Date(market.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Timezone</span>
              <span className="font-medium">Europe/Paris</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {market.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 h-4">{tag}</Badge>
        ))}
      </div>
    </div>
  );
}
