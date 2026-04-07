"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, TrendingUp } from "lucide-react";
import type { BettingZone } from "@/types";

interface BetSlipProps {
  zone: BettingZone;
}

export function BetSlip({ zone }: BetSlipProps) {
  const [horizon, setHorizon] = useState<"7d" | "30d" | "season">("7d");
  const [amount, setAmount] = useState(100);

  const odds = horizon === "season" ? zone.odds.season : zone.odds[horizon];
  const potential = Math.round(amount * odds);

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" />
          <span className="text-sm font-semibold">Parier sur {zone.name}</span>
        </div>

        {/* Horizon */}
        <Tabs value={horizon} onValueChange={(v) => setHorizon(v as "7d" | "30d" | "season")}>
          <TabsList className="w-full h-9">
            <TabsTrigger value="7d" className="flex-1 text-xs">7 jours</TabsTrigger>
            <TabsTrigger value="30d" className="flex-1 text-xs">30 jours</TabsTrigger>
            <TabsTrigger value="season" className="flex-1 text-xs">Saison</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="h-10 text-base font-semibold"
              min={10}
              max={10000}
            />
            <span className="text-sm text-muted-foreground shrink-0">EUR</span>
          </div>
          <Slider
            value={[amount]}
            onValueChange={(v) => setAmount(Array.isArray(v) ? v[0] : v)}
            min={10}
            max={5000}
            step={10}
            className="py-1"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>10</span>
            <span>5 000</span>
          </div>
        </div>

        {/* CTA — full width, thumb zone */}
        <Button className="w-full h-12 text-base font-semibold gap-2">
          <TrendingUp className="h-4 w-4" />
          Parier maintenant
        </Button>

        {/* Potential gain */}
        <div className="text-center text-sm text-muted-foreground">
          Gain potentiel :{" "}
          <span className="text-emerald-600 font-bold text-lg tabular-nums">{potential} EUR</span>
          <span className="text-muted-foreground text-xs ml-1">(x{odds})</span>
        </div>
      </CardContent>
    </Card>
  );
}
