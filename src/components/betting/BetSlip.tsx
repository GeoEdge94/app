"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Flame, TrendingUp, Wallet, Clock, AlertTriangle, Check } from "lucide-react";
import type { BettingZone } from "@/types";

interface BetSlipProps {
  zone: BettingZone;
}

export function BetSlip({ zone }: BetSlipProps) {
  const [horizon, setHorizon] = useState<"7d" | "30d" | "season">("7d");
  const [amount, setAmount] = useState(100);
  const [confirmed, setConfirmed] = useState(false);

  const odds = horizon === "season" ? zone.odds.season : zone.odds[horizon];
  const prob = horizon === "30d" ? zone.probability["30d"] : zone.probability["7d"];
  const potential = Math.round(amount * odds);
  const profit = potential - amount;
  const fee = Math.round(amount * 0.03);
  const netProfit = profit - fee;
  const maxBet = Math.round(zone.pool * 0.1);

  const expiresIn = horizon === "7d" ? "7 jours" : horizon === "30d" ? "30 jours" : "31 oct. 2026";

  if (confirmed) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Check className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Pari place !</p>
            <p className="text-xs text-emerald-600">
              {amount} EUR sur {zone.name} — x{odds}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-white rounded-lg">
              <p className="text-sm font-bold text-emerald-600 tabular-nums">{potential} EUR</p>
              <p className="text-[9px] text-muted-foreground">Gain potentiel</p>
            </div>
            <div className="p-2 bg-white rounded-lg">
              <p className="text-sm font-bold text-muted-foreground tabular-nums">{expiresIn}</p>
              <p className="text-[9px] text-muted-foreground">Expire dans</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setConfirmed(false)}>
            Nouveau pari
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold">Parier</span>
          </div>
          <span className="text-xs text-muted-foreground">{zone.name}</span>
        </div>

        {/* Horizon */}
        <Tabs value={horizon} onValueChange={(v) => setHorizon(v as "7d" | "30d" | "season")}>
          <TabsList className="w-full h-9">
            <TabsTrigger value="7d" className="flex-1 text-[11px]">
              <div className="text-center">
                <p>7 jours</p>
                <p className="text-[9px] text-primary font-bold">x{zone.odds["7d"]}</p>
              </div>
            </TabsTrigger>
            <TabsTrigger value="30d" className="flex-1 text-[11px]">
              <div className="text-center">
                <p>30 jours</p>
                <p className="text-[9px] text-primary font-bold">x{zone.odds["30d"]}</p>
              </div>
            </TabsTrigger>
            <TabsTrigger value="season" className="flex-1 text-[11px]">
              <div className="text-center">
                <p>Saison</p>
                <p className="text-[9px] text-primary font-bold">x{zone.odds.season}</p>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.min(Number(e.target.value) || 0, maxBet))}
              className="h-10 text-base font-semibold tabular-nums"
              min={10}
              max={maxBet}
            />
            <span className="text-sm text-muted-foreground shrink-0">EUR</span>
          </div>
          <Slider
            value={[amount]}
            onValueChange={(v) => setAmount(Array.isArray(v) ? v[0] : v)}
            min={10}
            max={maxBet}
            step={10}
            className="py-1"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Min: 10 EUR</span>
            <span>Max: {maxBet.toLocaleString()} EUR (10% pool)</span>
          </div>
        </div>

        <Separator />

        {/* Simulation detail */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Mise</span>
            <span className="font-medium tabular-nums">{amount.toLocaleString()} EUR</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Cote</span>
            <span className="font-medium text-primary tabular-nums">x{odds}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Probabilite</span>
            <span className="font-medium text-destructive tabular-nums">{Math.round(prob * 100)}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Fee plateforme (3%)</span>
            <span className="font-medium text-muted-foreground tabular-nums">-{fee} EUR</span>
          </div>
          <Separator />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Expire
            </span>
            <span className="font-medium tabular-nums">{expiresIn}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Gain net si gagne</span>
            <span className="text-emerald-600 tabular-nums">+{netProfit.toLocaleString()} EUR</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Retour total</span>
            <span className="font-bold text-emerald-600 tabular-nums">{(potential - fee).toLocaleString()} EUR</span>
          </div>
        </div>

        {/* Warning */}
        {amount > maxBet * 0.8 && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p className="text-[10px]">Mise elevee — proche du maximum pour cette zone.</p>
          </div>
        )}

        {/* CTA */}
        <Button className="w-full h-12 text-base font-semibold gap-2" onClick={() => setConfirmed(true)}>
          <TrendingUp className="h-4 w-4" />
          Parier {amount} EUR — Gain {(potential - fee).toLocaleString()} EUR
        </Button>
      </CardContent>
    </Card>
  );
}
