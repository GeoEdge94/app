"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, CloudRain, Wind, Flame, FileText, Clock, Users, TrendingUp, MapPin } from "lucide-react";
import { MarketMiniChart } from "./MarketMiniChart";
import type { PredictionMarket, MarketCategory } from "@/lib/markets-data";
import { PLATFORM_META } from "@/lib/markets-data";

const catIcons: Record<MarketCategory, typeof Flame> = {
  flood: Droplets, rain: CloudRain, storm: Wind, fire: Flame, catnat: FileText,
};
const catColors: Record<MarketCategory, string> = {
  flood: "text-blue-500 bg-blue-50", rain: "text-cyan-500 bg-cyan-50",
  storm: "text-gray-600 bg-gray-100", fire: "text-red-500 bg-red-50",
  catnat: "text-amber-600 bg-amber-50",
};
const typeLabels: Record<string, string> = {
  binary: "Oui / Non", threshold: "Seuil", count: "Compte", range: "Fourchette", multi: "Multi-choix",
};

export function MarketCard({ market, onSelect }: { market: PredictionMarket; onSelect: (m: PredictionMarket) => void }) {
  const Icon = catIcons[market.category];
  const colors = catColors[market.category];
  const yesPercent = Math.round(market.yesPrice * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(market.deadline).getTime() - Date.now()) / 86400000));

  return (
    <Card className="cursor-pointer hover:shadow-md active:scale-[0.99] transition-all" onClick={() => onSelect(market)}>
      <CardContent className="p-3">
        {/* Top row */}
        <div className="flex items-start gap-2.5 mb-2">
          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${colors}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-tight line-clamp-2">{market.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[9px] font-semibold px-1.5 py-0 h-4 inline-flex items-center rounded-full ${PLATFORM_META[market.platform].bg} ${PLATFORM_META[market.platform].color}`}>
                {PLATFORM_META[market.platform].name}
              </span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium">{typeLabels[market.type]}</Badge>
              {market.department && <span className="text-[10px] text-muted-foreground">Dept. {market.department}</span>}
            </div>
          </div>
        </div>

        {/* Probability bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-emerald-600">Oui {yesPercent}%</span>
            <span className="text-[11px] font-semibold text-red-500">Non {100 - yesPercent}%</span>
          </div>
          <div className="h-2 bg-red-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${yesPercent}%` }} />
          </div>
        </div>

        {/* Sparkline */}
        <div className="mb-1.5">
          <MarketMiniChart yesPrice={market.yesPrice} height={28} />
        </div>

        {/* Bottom stats */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> {(market.volume / 1000).toFixed(1)}k</span>
            <span className="flex items-center gap-0.5"><Users className="h-3 w-3" /> {market.participants}</span>
            {market.coordinates && <MapPin className="h-3 w-3 text-primary" />}
          </div>
          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {daysLeft}j</span>
        </div>
      </CardContent>
    </Card>
  );
}
