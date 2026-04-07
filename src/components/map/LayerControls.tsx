"use client";

import { Switch } from "@/components/ui/switch";
import { Flame, Map, Building2, Satellite, AlertTriangle, Droplets, CloudRain, CircleDot } from "lucide-react";
import { useMapStore } from "@/stores/useMapStore";
import type { MapLayer } from "@/types";

const layers: { id: MapLayer; label: string; icon: typeof Flame; color: string }[] = [
  { id: "zones", label: "Zones", icon: Map, color: "bg-primary" },
  { id: "fires", label: "Feux", icon: Flame, color: "bg-destructive" },
  { id: "markets", label: "Marches", icon: CircleDot, color: "bg-violet-500" },
  { id: "rivers", label: "Rivieres", icon: Droplets, color: "bg-blue-500" },
  { id: "vigilance", label: "Vigilance", icon: CloudRain, color: "bg-orange-500" },
  { id: "cadastre", label: "Cadastre", icon: Building2, color: "bg-gray-500" },
  { id: "satellite", label: "Satellite", icon: Satellite, color: "bg-indigo-500" },
  { id: "risk", label: "FWI", icon: AlertTriangle, color: "bg-purple-500" },
];

export function LayerControls() {
  const { activeLayers, toggleLayer } = useMapStore();

  return (
    <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-md border border-border rounded-xl p-2.5 shadow-lg space-y-0.5 max-w-[140px]">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-1">Calques</p>
      {layers.map((layer) => (
        <button
          key={layer.id}
          onClick={() => toggleLayer(layer.id)}
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
            activeLayers.has(layer.id)
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${activeLayers.has(layer.id) ? layer.color : "bg-muted-foreground/30"}`} />
          <layer.icon className="h-3.5 w-3.5" />
          <span>{layer.label}</span>
        </button>
      ))}
    </div>
  );
}
