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
  initDarkMode: () => void;
}

function applyDarkClass(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0A0A0A" : "#FFFFFF");
}

export const useMapStore = create<MapState>((set, get) => ({
  selectedZone: null,
  activeLayers: new Set<MapLayer>(["zones", "fires", "markets"]),
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
  toggleDarkMode: () => {
    const next = !get().darkMode;
    applyDarkClass(next);
    try { localStorage.setItem("geoedge-theme", next ? "dark" : "light"); } catch {}
    set({ darkMode: next });
  },
  initDarkMode: () => {
    if (typeof window === "undefined") return;
    let dark = false;
    try {
      const stored = localStorage.getItem("geoedge-theme");
      if (stored === "dark") dark = true;
      else if (stored === "light") dark = false;
      else dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      dark = false;
    }
    applyDarkClass(dark);
    set({ darkMode: dark });
  },
}));
