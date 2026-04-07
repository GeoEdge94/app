"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Droplets,
  CloudRain,
  Wind,
  Activity,
  ExternalLink,
  MapPin,
  Clock,
  Satellite,
  TrendingUp,
  Users,
} from "lucide-react";
import type { RealBet, RealBetCategory } from "@/lib/real-bets";

// ── Category config ──────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  RealBetCategory,
  {
    icon: typeof Flame;
    label: string;
    color: string;
    badgeBg: string;
  }
> = {
  fire: {
    icon: Flame,
    label: "Feu",
    color: "text-orange-500",
    badgeBg: "bg-orange-500/10 text-orange-600",
  },
  flood: {
    icon: Droplets,
    label: "Inondation",
    color: "text-blue-500",
    badgeBg: "bg-blue-500/10 text-blue-600",
  },
  rain: {
    icon: CloudRain,
    label: "Pluie",
    color: "text-sky-500",
    badgeBg: "bg-sky-500/10 text-sky-600",
  },
  storm: {
    icon: Wind,
    label: "Tempete",
    color: "text-violet-500",
    badgeBg: "bg-violet-500/10 text-violet-600",
  },
  earthquake: {
    icon: Activity,
    label: "Seisme",
    color: "text-red-500",
    badgeBg: "bg-red-500/10 text-red-600",
  },
};

// ── Countdown helper ─────────────────────────────────────────────

function useCountdown(deadline: string): string {
  const now = new Date();
  const end = new Date(deadline);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return "Expire";

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}j ${hours}h`;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

// ── Props ────────────────────────────────────────────────────────

interface RealBetCardProps {
  bet: RealBet;
  onBet?: (bet: RealBet, side: "yes" | "no") => void;
  compact?: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function RealBetCard({ bet, onBet, compact = false }: RealBetCardProps) {
  const [hoveredSide, setHoveredSide] = useState<"yes" | "no" | null>(null);
  const config = CATEGORY_CONFIG[bet.category];
  const Icon = config.icon;
  const countdown = useCountdown(bet.deadline);
  const isExpired = countdown === "Expire";

  const yesPct = Math.round(bet.yesPrice * 100);
  const noPct = Math.round(bet.noPrice * 100);

  return (
    <Card className={`transition-all ${isExpired ? "opacity-60" : "hover:shadow-md"}`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        {/* Header row: category badge + countdown */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeBg}`}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </span>

          <span
            className={`inline-flex items-center gap-1 text-xs ${
              isExpired ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3 w-3" />
            {countdown}
          </span>
        </div>

        {/* Title */}
        <h3 className={`font-semibold leading-tight mb-3 ${compact ? "text-sm" : "text-sm"}`}>
          {bet.title}
        </h3>

        {/* Probability bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span
              className={`font-semibold ${
                hoveredSide === "yes" ? "text-emerald-600" : "text-muted-foreground"
              }`}
            >
              Oui {yesPct}%
            </span>
            <span
              className={`font-semibold ${
                hoveredSide === "no" ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              Non {noPct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden flex">
            <div
              className={`h-full transition-all ${
                hoveredSide === "yes" ? "bg-emerald-500" : "bg-emerald-400"
              }`}
              style={{ width: `${yesPct}%` }}
            />
            <div
              className={`h-full transition-all ${
                hoveredSide === "no" ? "bg-red-500" : "bg-red-300"
              }`}
              style={{ width: `${noPct}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {bet.volume.toLocaleString("fr-FR")} EUR
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {bet.participants}
          </span>
          {bet.coordinates && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {bet.coordinates.lat.toFixed(2)}, {bet.coordinates.lon.toFixed(2)}
            </span>
          )}
        </div>

        {/* Oracle source */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs mb-3">
          <Satellite className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-muted-foreground truncate">
              Oracle: {bet.proof}
            </p>
            <a
              href={bet.oracleSource}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline mt-0.5"
            >
              Source officielle
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>

        {/* Link to original bet */}
        {bet.url && (
          <a
            href={bet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 mb-3 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Voir sur la plateforme
          </a>
        )}

        {/* Bet buttons */}
        {!isExpired && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              onMouseEnter={() => setHoveredSide("yes")}
              onMouseLeave={() => setHoveredSide(null)}
              onClick={() => onBet?.(bet, "yes")}
            >
              Parier Oui — {yesPct}c
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600"
              onMouseEnter={() => setHoveredSide("no")}
              onMouseLeave={() => setHoveredSide(null)}
              onClick={() => onBet?.(bet, "no")}
            >
              Parier Non — {noPct}c
            </Button>
          </div>
        )}

        {isExpired && (
          <Badge variant="secondary" className="w-full justify-center py-1">
            Marche expire — en attente de resolution oracle
          </Badge>
        )}
      </CardContent>

      {/* Footer: department + magnitude/threshold info */}
      {(bet.department || bet.magnitude || bet.threshold) && (
        <CardFooter className="text-xs text-muted-foreground gap-3">
          {bet.department && (
            <span>Dept. {bet.department}</span>
          )}
          {bet.magnitude && (
            <span>Derniere mag: M{bet.magnitude.toFixed(1)}</span>
          )}
          {bet.threshold && (
            <span>Seuil: {bet.threshold}m</span>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
