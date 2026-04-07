"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { LayerControls } from "@/components/map/LayerControls";
import { ZoneCard } from "@/components/betting/ZoneCard";
import { ZoneDetail } from "@/components/betting/ZoneDetail";
import { BetSlip } from "@/components/betting/BetSlip";
import { PortfolioView } from "@/components/betting/PortfolioView";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Flame, TrendingUp, Users, Loader2, Database, MapPin } from "lucide-react";
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
  const [panelView, setPanelView] = useState<"list" | "detail" | "bet">("list");

  // Data hooks
  const { zones: firestoreZones, loading: zonesLoading } = useZones();
  const { fires, loading: firesLoading, count: fireCount } = useFireData();
  const { weather, loading: weatherLoading } = useWeatherData();
  const { cadastre, count: parcelCount } = useCadastreData();

  // Merge live weather
  const zones = useMemo(() => {
    return firestoreZones.map((z) => {
      const w = weather[z.zoneId];
      return w ? { ...z, meteo: w } : z;
    });
  }, [firestoreZones, weather]);

  const totalPool = zones.reduce((s, z) => s + z.pool, 0);
  const totalBets = zones.reduce((s, z) => s + z.activeBets, 0);

  function handleZoneSelect(zone: typeof zones[0]) {
    setSelectedZone(zone);
    setPanelView("detail");
    if (sheetSnap === "collapsed") setSheetSnap("half");
  }

  function handleBet() {
    setPanelView("bet");
    setSheetSnap("full");
  }

  function handleBack() {
    setPanelView(panelView === "bet" ? "detail" : "list");
    setSelectedZone(panelView === "bet" ? selectedZone : null);
  }

  // Panel content based on active tab and view
  function renderPanel() {
    // Portfolio tab
    if (activeTab === "portfolio") {
      return (
        <ScrollArea className="flex-1">
          <div className="px-3 py-3">
            <PortfolioView />
          </div>
        </ScrollArea>
      );
    }

    // Map tab — zone list / detail / bet
    return (
      <ScrollArea className="flex-1">
        {panelView === "list" && (
          <>
            <div className="px-4 pt-2 pb-1 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Zones de paris</h2>
                <p className="text-[11px] text-muted-foreground">
                  {zonesLoading ? "Chargement..." : `${zones.length} zones — ${fireCount} feux — ${parcelCount.toLocaleString()} parcelles`}
                </p>
              </div>
              {!weatherLoading && !zonesLoading && (
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">LIVE</span>
              )}
            </div>
            <Separator className="my-1" />
            {zonesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="px-3 py-2 space-y-2">
                {zones.map((zone) => (
                  <ZoneCard
                    key={zone.zoneId}
                    zone={zone}
                    onSelect={handleZoneSelect}
                    selected={selectedZone?.zoneId === zone.zoneId}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {panelView === "detail" && selectedZone && (
          <div className="px-3 py-3 space-y-3">
            <ZoneDetail zone={selectedZone} onBack={handleBack} />
            <Separator />
            <button
              onClick={handleBet}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <TrendingUp className="h-4 w-4" />
              Parier sur cette zone
            </button>
          </div>
        )}

        {panelView === "bet" && selectedZone && (
          <div className="px-3 py-3 space-y-3">
            <button onClick={handleBack} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              ← Retour au detail
            </button>
            <BetSlip zone={selectedZone} />
          </div>
        )}
      </ScrollArea>
    );
  }

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
            <MapView zones={zones} firesGeoJson={fires} cadastreGeoJson={cadastre} onZoneClick={handleZoneSelect} />
          )}
          {!zonesLoading && <LayerControls />}

          {/* Stats bar */}
          <div className="absolute left-0 right-0 flex items-center justify-center gap-2.5 px-3 py-1.5 bg-background/80 backdrop-blur-md border-t border-border/50 z-10 bottom-14 md:bottom-0 md:right-[380px]">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Database className="h-2.5 w-2.5 text-primary" />
              <span className="text-primary font-medium">Firestore</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TrendingUp className="h-2.5 w-2.5" />
              <span className="font-medium text-foreground">{zones.length}</span> zones
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Flame className="h-2.5 w-2.5 text-destructive" />
              <span className="font-medium text-destructive">{fireCount}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 text-indigo-500" />
              <span className="font-medium text-indigo-600">{parcelCount > 0 ? `${(parcelCount / 1000).toFixed(0)}k` : "..."}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-2.5 w-2.5" />
              <span className="font-medium text-foreground">{totalBets}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="font-medium text-emerald-600">{(totalPool / 1000).toFixed(0)}k</span>
              <span className="text-muted-foreground">EUR</span>
            </div>
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
          {/* Sheet handle */}
          <button
            className="md:hidden flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
            onClick={() => setSheetSnap(sheetSnap === "collapsed" ? "half" : "collapsed")}
          >
            <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
          </button>

          {renderPanel()}
        </aside>
      </main>

      <BottomNav
        active={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "map") setPanelView("list");
          setSheetSnap("half");
        }}
      />
    </div>
  );
}
