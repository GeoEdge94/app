"use client";

import { useState, useMemo } from "react";
import { MarketCard } from "./MarketCard";
import { MarketDetail } from "./MarketDetail";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, SlidersHorizontal, TrendingUp, Droplets, CloudRain, Wind, Flame, FileText } from "lucide-react";
import { MARKETS, CATEGORY_LABELS, type PredictionMarket, type MarketCategory } from "@/lib/markets-data";

const categories: { id: MarketCategory | "all"; label: string; icon: typeof Flame }[] = [
  { id: "all", label: "Tous", icon: SlidersHorizontal },
  { id: "flood", label: "Crues", icon: Droplets },
  { id: "rain", label: "Pluie", icon: CloudRain },
  { id: "storm", label: "Vent", icon: Wind },
  { id: "fire", label: "Feux", icon: Flame },
  { id: "catnat", label: "Cat Nat", icon: FileText },
];

export function MarketsList() {
  const [filter, setFilter] = useState<MarketCategory | "all">("all");
  const [selected, setSelected] = useState<PredictionMarket | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = filter === "all" ? MARKETS : MARKETS.filter((m) => m.category === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.title.toLowerCase().includes(q) || m.tags.some((t) => t.includes(q)));
    }
    return list.sort((a, b) => b.volume - a.volume);
  }, [filter, search]);

  const totalVolume = MARKETS.reduce((s, m) => s + m.volume, 0);

  if (selected) {
    return (
      <ScrollArea className="flex-1">
        <div className="px-3 py-3">
          <MarketDetail market={selected} onBack={() => setSelected(null)} />
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Marches de prediction</h2>
            <p className="text-[11px] text-muted-foreground">{MARKETS.length} marches — {(totalVolume / 1000).toFixed(0)}k EUR volume</p>
          </div>
          <Badge variant="outline" className="text-[9px]">Prototype</Badge>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un marche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-muted/50 rounded-lg border-0 outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
              filter === cat.id ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <cat.icon className="h-3 w-3" />
            {cat.label}
          </button>
        ))}
      </div>

      <Separator className="mb-2" />

      {/* Stats bar */}
      <div className="px-3 pb-2 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {filtered.length} marches</span>
        <span className="font-medium text-emerald-600">{(filtered.reduce((s, m) => s + m.volume, 0) / 1000).toFixed(0)}k EUR</span>
        <span>{filtered.reduce((s, m) => s + m.participants, 0)} participants</span>
      </div>

      {/* Market cards */}
      <div className="px-3 pb-4 space-y-2">
        {filtered.map((market) => (
          <MarketCard key={market.id} market={market} onSelect={setSelected} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Aucun marche trouve</p>
        )}
      </div>
    </ScrollArea>
  );
}
