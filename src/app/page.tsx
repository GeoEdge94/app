"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { LayerControls } from "@/components/map/LayerControls";
import { BetBanner } from "@/components/map/BetBanner";
import { ZoneCard } from "@/components/betting/ZoneCard";
import { ZoneDetail } from "@/components/betting/ZoneDetail";
import { BetSlip } from "@/components/betting/BetSlip";
import { PortfolioView } from "@/components/betting/PortfolioView";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { LoginForm } from "@/components/auth/LoginForm";
import { AccountPanel } from "@/components/auth/AccountPanel";
import { useAuthStore, initAuthListener } from "@/lib/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Flame, TrendingUp, Users, Loader2, Database, MapPin } from "lucide-react";
import { useMapStore } from "@/stores/useMapStore";
import { useFireData } from "@/hooks/useFireData";
import { useWeatherData } from "@/hooks/useWeatherData";
import { useZones } from "@/hooks/useZones";
import { useCadastreData } from "@/hooks/useCadastreData";
import { useHydroData } from "@/hooks/useHydroData";
import { MarketsList } from "@/components/markets/MarketsList";
import { MarketCard } from "@/components/markets/MarketCard";
import { MARKETS } from "@/lib/markets-data";
import { MOCK_BETS } from "@/lib/mock-data";
import { WalletPanel } from "@/components/wallet/WalletPanel";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((m) => ({ default: m.MapView })),
  { ssr: false, loading: () => <div className="w-full h-full bg-muted animate-pulse" /> }
);

export default function Home() {
  const { selectedZone, setSelectedZone, deselectZone, sheetSnap, setSheetSnap, initDarkMode, darkMode } = useMapStore();
  const { user, loading: authLoading } = useAuthStore();

  // Init dark mode + auth listener
  useEffect(() => { initDarkMode(); }, [initDarkMode]);
  useEffect(() => { const unsub = initAuthListener(); return unsub; }, []);

  const [activeTab, setActiveTab] = useState<"map" | "portfolio" | "simulator" | "account">("map");
  const [panelView, setPanelView] = useState<"list" | "detail" | "bet">("list");

  const { zones: firestoreZones, loading: zonesLoading } = useZones();
  const { fires, count: fireCount } = useFireData();
  const { weather, loading: weatherLoading } = useWeatherData();
  const { cadastre, count: parcelCount } = useCadastreData();
  const { rivers, vigilance } = useHydroData();

  const zones = useMemo(() => {
    return firestoreZones.map((z) => {
      const w = weather[z.zoneId];
      return w ? { ...z, meteo: w } : z;
    });
  }, [firestoreZones, weather]);

  const totalPool = zones.reduce((s, z) => s + z.pool, 0);
  const totalBets = zones.reduce((s, z) => s + z.activeBets, 0);

  // Zone selected from map or card
  const handleZoneSelect = useCallback((zone: typeof zones[0]) => {
    setSelectedZone(zone);
    setPanelView("detail");
    setSheetSnap("half");
  }, [setSelectedZone, setSheetSnap]);

  // Click on empty map → collapse + deselect
  const handleDeselect = useCallback(() => {
    deselectZone();
    setPanelView("list");
  }, [deselectZone]);

  // Open bet slip
  const handleBet = useCallback(() => {
    setPanelView("bet");
    setSheetSnap("full");
  }, [setSheetSnap]);

  // Back navigation
  const handleBack = useCallback(() => {
    if (panelView === "bet") {
      setPanelView("detail");
      setSheetSnap("half");
    } else {
      setPanelView("list");
      deselectZone();
    }
  }, [panelView, deselectZone, setSheetSnap]);

  // Auth gate — show login if not authenticated
  if (!authLoading && !user) {
    return <LoginForm />;
  }

  function renderPanel() {
    if (activeTab === "account") {
      return <AccountPanel />;
    }

    if (activeTab === "portfolio") {
      return (
        <ScrollArea className="flex-1">
          <div className="px-3 py-3 space-y-4">
            <WalletPanel />
            <Separator />
            <PortfolioView />
          </div>
        </ScrollArea>
      );
    }

    if (activeTab === "simulator") {
      return <MarketsList />;
    }

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
                <div className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                  <span className="text-[9px] text-emerald-600 font-medium">LIVE</span>
                </div>
              )}
            </div>
            <Separator className="my-1" />
            <div className="px-3 py-2 space-y-2">
                {/* Active bets banner */}
                {MOCK_BETS.filter((b) => b.status === "active").length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider px-1">Mes paris actifs</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {MOCK_BETS.filter((b) => b.status === "active").slice(0, 4).map((bet) => (
                        <div key={bet.betId} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <div>
                            <p className="text-[11px] font-semibold whitespace-nowrap">{bet.zoneName.length > 18 ? bet.zoneName.substring(0, 18) + "..." : bet.zoneName}</p>
                            <p className="text-[9px] text-muted-foreground">{bet.amount}€ · x{bet.odds} · {bet.horizon}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-1" />
                  </>
                )}

                {/* Zone cards */}
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Zones feux</p>
                {zones.map((zone) => (
                  <ZoneCard key={zone.zoneId} zone={zone} onSelect={handleZoneSelect} selected={selectedZone?.zoneId === zone.zoneId} />
                ))}

                {/* Top prediction markets */}
                <Separator className="my-1" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Marches tendance</p>
                {MARKETS.sort((a, b) => b.volume - a.volume).slice(0, 3).map((m) => (
                  <MarketCard key={m.id} market={m} onSelect={() => {}} />
                ))}
              </div>
          </>
        )}

        {panelView === "detail" && selectedZone && (
          <div className="px-3 py-3">
            <ZoneDetail zone={selectedZone} onBack={handleBack} onBet={handleBet} />
          </div>
        )}

        {panelView === "bet" && selectedZone && (
          <div className="px-3 py-3 space-y-3">
            <button onClick={handleBack} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              ← Retour au detail
            </button>
            <BetSlip zone={selectedZone} />
          </div>
        )}
      </ScrollArea>
    );
  }

  // Peek content for collapsed sheet
  const peekContent = (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold truncate">
        {selectedZone ? selectedZone.name : `${zones.length} zones actives`}
      </span>
      {selectedZone && <RiskBadgeMini level={selectedZone.riskLevel} />}
    </div>
  );

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header />

      <main className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative">
          <MapView key={darkMode ? "dark" : "light"} zones={zones} firesGeoJson={fires} cadastreGeoJson={cadastre} riversGeoJson={rivers} vigilanceGeoJson={vigilance} onZoneClick={handleZoneSelect} onDeselect={handleDeselect} />
          <LayerControls />
          <BetBanner />

          {/* Stats bar */}
          <div className="absolute left-0 right-0 flex items-center justify-center gap-2.5 px-3 py-1.5 bg-background/80 backdrop-blur-md border-t border-border/50 z-10 bottom-14 md:bottom-0 md:right-[380px]">
            <div className="flex items-center gap-1 text-[10px]">
              <Database className="h-2.5 w-2.5 text-primary" />
              <span className="text-primary font-medium">Firestore</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TrendingUp className="h-2.5 w-2.5" /><span className="font-medium text-foreground">{zones.length}</span> zones
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <Flame className="h-2.5 w-2.5 text-destructive" /><span className="font-medium text-destructive">{fireCount}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <MapPin className="h-2.5 w-2.5 text-indigo-500" /><span className="font-medium text-indigo-600">{parcelCount > 0 ? `${(parcelCount / 1000).toFixed(0)}k` : "..."}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="font-medium text-emerald-600">{(totalPool / 1000).toFixed(0)}k</span>
              <span className="text-muted-foreground">EUR</span>
            </div>
          </div>
        </div>

        {/* PANEL / SHEET */}
        <BottomSheet peekContent={peekContent}>
          {renderPanel()}
        </BottomSheet>
      </main>

      <BottomNav
        active={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "map") { setPanelView("list"); setSheetSnap("half"); }
          else { setSheetSnap("half"); }
        }}
      />
    </div>
  );
}

// Mini risk badge for collapsed peek
function RiskBadgeMini({ level }: { level: string }) {
  const colors: Record<string, string> = {
    critical: "bg-purple-500", high: "bg-red-500", moderate: "bg-amber-500", low: "bg-emerald-500",
  };
  return <div className={`w-2 h-2 rounded-full ${colors[level] || "bg-gray-400"}`} />;
}
