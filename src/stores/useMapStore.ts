import { create } from "zustand";
import type { BettingZone, MapLayer } from "@/types";

interface MapState {
  selectedZone: BettingZone | null;
  activeLayers: Set<MapLayer>;
  sheetSnap: "collapsed" | "half" | "full";
  darkMode: boolean;
  setSelectedZone: (zone: BettingZone | null) => void;
  deselectZone: () => void;
  toggleLayer: (layer: MapLayer) => void;
  setSheetSnap: (snap: "collapsed" | "half" | "full") => void;
  toggleDarkMode: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedZone: null,
  activeLayers: new Set<MapLayer>(["zones", "fires"]),
  sheetSnap: "half",
  darkMode: false,
  setSelectedZone: (zone) =>
    set({ selectedZone: zone, sheetSnap: zone ? "half" : "collapsed" }),
  deselectZone: () =>
    set({ selectedZone: null, sheetSnap: "collapsed" }),
  toggleLayer: (layer) =>
    set((state) => {
      const next = new Set(state.activeLayers);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return { activeLayers: next };
    }),
  setSheetSnap: (snap) => set({ sheetSnap: snap }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
