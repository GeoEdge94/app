import { create } from "zustand";
import type { BettingZone, MapLayer } from "@/types";

interface MapState {
  selectedZone: BettingZone | null;
  activeLayers: Set<MapLayer>;
  sheetOpen: boolean;
  sheetSnap: "collapsed" | "half" | "full";
  darkMode: boolean;
  baseMap: "streets" | "satellite";
  setSelectedZone: (zone: BettingZone | null) => void;
  toggleLayer: (layer: MapLayer) => void;
  setSheetOpen: (open: boolean) => void;
  setSheetSnap: (snap: "collapsed" | "half" | "full") => void;
  toggleDarkMode: () => void;
  setBaseMap: (base: "streets" | "satellite") => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedZone: null,
  activeLayers: new Set<MapLayer>(["zones", "fires"]),
  sheetOpen: true,
  sheetSnap: "half",
  darkMode: false,
  baseMap: "streets",
  setSelectedZone: (zone) => set({ selectedZone: zone, sheetSnap: "half", sheetOpen: true }),
  toggleLayer: (layer) =>
    set((state) => {
      const next = new Set(state.activeLayers);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return { activeLayers: next };
    }),
  setSheetOpen: (open) => set({ sheetOpen: open }),
  setSheetSnap: (snap) => set({ sheetSnap: snap }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setBaseMap: (base) => set({ baseMap: base }),
}));
