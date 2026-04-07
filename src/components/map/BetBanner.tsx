"use client";

import { useRef, useEffect } from "react";
import { Flame, Droplets, CloudRain, Wind, FileText, TrendingUp, Clock, Zap } from "lucide-react";
import { MARKETS, type MarketCategory } from "@/lib/markets-data";

const catIcons: Record<MarketCategory, typeof Flame> = {
  flood: Droplets, rain: CloudRain, storm: Wind, fire: Flame, catnat: FileText,
};
const catColors: Record<MarketCategory, { bg: string; text: string; dot: string }> = {
  flood: { bg: "bg-blue-500/10", text: "text-blue-700", dot: "bg-blue-500" },
  rain: { bg: "bg-cyan-500/10", text: "text-cyan-700", dot: "bg-cyan-500" },
  storm: { bg: "bg-gray-500/10", text: "text-gray-700", dot: "bg-gray-500" },
  fire: { bg: "bg-red-500/10", text: "text-red-700", dot: "bg-red-500" },
  catnat: { bg: "bg-amber-500/10", text: "text-amber-700", dot: "bg-amber-500" },
};

// Top trending markets sorted by volume
const trending = [...MARKETS]
  .sort((a, b) => b.volume - a.volume)
  .slice(0, 8);

export function BetBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf: number;
    let pos = 0;
    const speed = 0.3;

    function tick() {
      pos += speed;
      if (pos >= el!.scrollWidth / 2) pos = 0;
      el!.scrollLeft = pos;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    // Pause on hover/touch
    const pause = () => cancelAnimationFrame(raf);
    const resume = () => { raf = requestAnimationFrame(tick); };
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
    };
  }, []);

  // Duplicate items for infinite scroll
  const items = [...trending, ...trending];

  return (
    <div className="absolute top-14 md:top-3 left-0 right-0 md:right-[380px] z-10 pointer-events-none">
      <div className="mx-3">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-hidden pointer-events-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((m, i) => {
            const Icon = catIcons[m.category];
            const colors = catColors[m.category];
            const yesP = Math.round(m.yesPrice * 100);
            const daysLeft = Math.max(0, Math.ceil((new Date(m.deadline).getTime() - Date.now()) / 86400000));

            return (
              <div
                key={`${m.id}-${i}`}
                className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} backdrop-blur-sm border border-white/30 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
                <Icon className={`h-3 w-3 ${colors.text}`} />
                <span className={`text-[11px] font-semibold ${colors.text} whitespace-nowrap max-w-[140px] truncate`}>
                  {m.title.length > 35 ? m.title.substring(0, 35) + "..." : m.title}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 tabular-nums">{yesP}%</span>
                <span className="text-[9px] text-muted-foreground tabular-nums">{(m.volume / 1000).toFixed(0)}k</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
