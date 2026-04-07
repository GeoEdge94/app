"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { LayerControls } from "@/components/map/LayerControls";
import { ZoneCard } from "@/components/betting/ZoneCard";
import { BetSlip } from "@/components/betting/BetSlip";
import { OddsChart } from "@/components/betting/OddsChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Flame, TrendingUp, Users, Loader2, Database } from "lucide-react";
import { useMapStore } from "@/stores/useMapStore";
import { useFireData } from "@/hooks/useFireData";
import { useWeatherData } from "@/hooks/useWeatherData";
import { useZones } from "@/hooks/useZones";
import { useCadastreData } from "@/hooks/useCadastreData";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((m) => ({ default: m.MapView })),
  { ssr: false, loading: () => <div className="w-full h-full bg-muted animate-pulse" /> }
);

export default function Home() {
  const { selectedZone, setSelectedZone, sheetSnap, setSheetSnap } = useMapStore();
  const [activeTab, setActiveTab] = useState<"map" | "portfolio" | "simulator" | "telegram">("map");

  // Data from Firestore + APIs
  const { zones: firestoreZones, loading: zonesLoading, error: zonesError } = useZones();
  const { fires, loading: firesLoading, count: fireCount } = useFireData();
  const { weather, loading: weatherLoading } = useWeatherData();
  const { cadastre, count: parcelCount } = useCadastreData();

  // Merge real-time weather into Firestore zones
  const zones = useMemo(() => {
    return firestoreZones.map((z) => {
      const w = weather[z.zoneId];
      if (!w) return z;
      return { ...z, meteo: w };
    });
  }, [firestoreZones, weather]);

  const totalPool = zones.reduce((s, z) => s + z.pool, 0);
  const totalBets = zones.reduce((s, z) => s + z.activeBets, 0);

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header />

      <main className="flex flex-1 overflow-hidden relative">
        {/* MAP */}
        <div className="flex-1 relative">
          {zonesLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Chargement Firestore...</span>
              </div>
            </div>
          ) : (
            <MapView zones={zones} firesGeoJson={fires} cadastreGeoJson={cadastre} onZoneClick={setSelectedZone} />
          )}
          {!zonesLoading && <LayerControls />}

          {/* Stats bar — glassmorphism */}
          <div className="absolute left-0 right-0 flex items-center justify-center gap-3 sm:gap-4 px-3 py-2 bg-background/80 backdrop-blur-md border-t border-border/50 z-10 bottom-14 md:bottom-0 md:right-[380px]">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Database className="h-3 w-3 text-primary" />
              <span className="text-[9px] text-primary font-medium">Firestore</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium text-foreground">{zones.length}</span> zones
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="font-medium text-foreground">{totalBets}</span> paris
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="font-medium text-emerald-600">{(totalPool / 1000).toFixed(0)}k</span> pool
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <Flame className="h-3 w-3 text-destructive" />
              {firesLoading ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : (
                <span className="font-medium text-destructive">{fireCount}</span>
              )}
              <span className="text-muted-foreground">feux</span>
            </div>
            {parcelCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="font-medium text-indigo-600">{parcelCount}</span> parcelles
              </div>
            )}
          </div>
        </div>

        {/* SIDE PANEL / BOTTOM SHEET */}
        <aside
          className={`
            bg-background border-l border-border z-30 flex flex-col
            md:w-[380px] md:relative md:h-full
            fixed left-0 right-0
            md:rounded-none rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:shadow-none
            transition-[height] duration-300 ease-out
            ${sheetSnap === "collapsed" ? "h-[100px]" : sheetSnap === "full" ? "h-[85dvh]" : "h-[55dvh]"}
            md:!h-full bottom-14 md:bottom-0
          `}
        >
          {/* Sheet handle — mobile */}
          <button
            className="md:hidden flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
            onClick={() => setSheetSnap(sheetSnap === "collapsed" ? "half" : "collapsed")}
          >
            <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
          </button>

          <ScrollArea className="flex-1">
            <div className="px-4 pt-2 pb-1 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Zones actives</h2>
                <p className="text-[11px] text-muted-foreground">
                  {zonesLoading ? "Chargement..." : zonesError ? `Erreur: ${zonesError}` : `${zones.length} zones Firestore — ${fireCount} feux FIRMS`}
                </p>
              </div>
              {!weatherLoading && !zonesLoading && (
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">LIVE</span>
              )}
            </div>

            <Separator className="my-1" />

            {zonesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="px-3 py-2 space-y-2">
                {zones.map((zone) => (
                  <ZoneCard
                    key={zone.zoneId}
                    zone={zone}
                    onSelect={setSelectedZone}
                    selected={selectedZone?.zoneId === zone.zoneId}
                  />
                ))}
              </div>
            )}

            <Separator className="my-2" />

            {selectedZone && (
              <div className="px-3 pb-2">
                <BetSlip zone={selectedZone} />
              </div>
            )}

            {selectedZone && (
              <div className="px-3 pb-4">
                <OddsChart zoneName={selectedZone.name} />
              </div>
            )}
          </ScrollArea>
        </aside>
      </main>

      <BottomNav active={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
