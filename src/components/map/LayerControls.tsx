"use client";

import { useState } from "react";
import { Flame, Map, Building2, Satellite, AlertTriangle, Droplets, CloudRain, CircleDot, Layers, X } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const activeCount = activeLayers.size;

  return (
    <div className="absolute top-12 left-3 z-20">
      {/* Collapsed: single button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-background/90 backdrop-blur-md border border-border rounded-xl shadow-lg text-xs font-medium"
        >
          <Layers className="h-4 w-4 text-primary" />
          <span>{activeCount}</span>
        </button>
      )}

      {/* Expanded: layer list */}
      {open && (
        <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl p-2 shadow-lg w-[150px]">
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Calques</p>
            <button onClick={() => setOpen(false)} className="p-0.5 rounded hover:bg-accent">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
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
      )}
    </div>
  );
}
