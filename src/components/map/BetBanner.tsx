"use client";

import { useRef, useEffect } from "react";
import { Flame, Droplets, CloudRain, Wind, FileText } from "lucide-react";
import { MARKETS, type MarketCategory } from "@/lib/markets-data";

const catIcons: Record<MarketCategory, typeof Flame> = {
  flood: Droplets, rain: CloudRain, storm: Wind, fire: Flame, catnat: FileText,
};
const catColors: Record<MarketCategory, { bg: string; text: string; dot: string }> = {
  flood: { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  rain: { bg: "bg-cyan-500/10 dark:bg-cyan-500/20", text: "text-cyan-700 dark:text-cyan-300", dot: "bg-cyan-500" },
  storm: { bg: "bg-gray-500/10 dark:bg-gray-500/20", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" },
  fire: { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
  catnat: { bg: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
};

const trending = [...MARKETS].sort((a, b) => b.volume - a.volume).slice(0, 8);

export function BetBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf: number;
    let pos = 0;

    function tick() {
      pos += 0.3;
      if (pos >= el!.scrollWidth / 2) pos = 0;
      el!.scrollLeft = pos;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

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

  const items = [...trending, ...trending];

  return (
    <div className="absolute top-3 left-0 right-0 md:right-[380px] z-10 pointer-events-none">
      <div className="mx-3">
        <div
          ref={scrollRef}
          className="flex gap-1.5 overflow-x-hidden pointer-events-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((m, i) => {
            const Icon = catIcons[m.category];
            const colors = catColors[m.category];
            const yesP = Math.round(m.yesPrice * 100);

            return (
              <div
                key={`${m.id}-${i}`}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg} backdrop-blur-sm border border-border/20 shadow-sm`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
                <Icon className={`h-3 w-3 ${colors.text}`} />
                <span className={`text-[10px] font-semibold ${colors.text} whitespace-nowrap max-w-[120px] truncate`}>
                  {m.title.length > 28 ? m.title.substring(0, 28) + "..." : m.title}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{yesP}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
