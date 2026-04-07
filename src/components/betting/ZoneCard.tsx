"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { Thermometer, Droplets, Wind, CloudRain } from "lucide-react";
import type { BettingZone } from "@/types";

interface ZoneCardProps {
  zone: BettingZone;
  onSelect: (zone: BettingZone) => void;
  selected?: boolean;
}

export function ZoneCard({ zone, onSelect, selected }: ZoneCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all active:scale-[0.98] ${
        selected ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"
      }`}
      onClick={() => onSelect(zone)}
    >
      <CardContent className="p-3">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{zone.name}</p>
            <p className="text-[11px] text-muted-foreground">{zone.department}</p>
          </div>
          <RiskBadge level={zone.riskLevel} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center">
            <p className="text-lg font-bold text-primary tabular-nums">x{zone.odds["7d"]}</p>
            <p className="text-[10px] text-muted-foreground">Cote</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-destructive tabular-nums">{Math.round(zone.probability["7d"] * 100)}%</p>
            <p className="text-[10px] text-muted-foreground">Proba 7j</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600 tabular-nums">{(zone.pool / 1000).toFixed(1)}k</p>
            <p className="text-[10px] text-muted-foreground">Pool</p>
          </div>
        </div>

        {/* Meteo strip */}
        <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 flex-1">
            <Thermometer className="h-3 w-3 text-orange-500" />
            <span className="text-[11px] font-medium">{zone.meteo.temp}°</span>
          </div>
          <div className="flex items-center gap-1 flex-1">
            <Droplets className="h-3 w-3 text-blue-500" />
            <span className="text-[11px] font-medium">{zone.meteo.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 flex-1">
            <Wind className="h-3 w-3 text-gray-500" />
            <span className="text-[11px] font-medium">{zone.meteo.wind}</span>
          </div>
          <div className="flex items-center gap-1 flex-1">
            <CloudRain className="h-3 w-3 text-blue-400" />
            <span className="text-[11px] font-medium">{zone.meteo.precipitation}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
