"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ZONE_GEOMETRIES } from "@/lib/zone-geometries";
import type { BettingZone } from "@/types";

// ─── LOCAL FALLBACK ZONES (if Firestore is slow/down) ───
const FALLBACK_ZONES: BettingZone[] = [
  { zoneId: "ZONE-VAR-001", name: "Massif des Maures", department: "Var (83)", vegetation: "foret_mixte", riskLevel: "critical", odds: { "7d": 1.8, "30d": 1.3, season: 1.1 }, probability: { "7d": 0.55, "30d": 0.89 }, pool: 28400, activeBets: 92, meteo: { temp: 22.3, humidity: 35, wind: 22, precipitation: 0 }, fwiIndex: 95, geometry: ZONE_GEOMETRIES["ZONE-VAR-001"] || { type: "Polygon", coordinates: [] } },
  { zoneId: "ZONE-GIR-001", name: "Foret des Landes", department: "Gironde (33)", vegetation: "pinede", riskLevel: "critical", odds: { "7d": 1.5, "30d": 1.2, season: 1.05 }, probability: { "7d": 0.48, "30d": 0.85 }, pool: 42100, activeBets: 128, meteo: { temp: 24.5, humidity: 30, wind: 25, precipitation: 0 }, fwiIndex: 88, geometry: ZONE_GEOMETRIES["ZONE-GIR-001"] || { type: "Polygon", coordinates: [] } },
  { zoneId: "ZONE-MRS-001", name: "Calanques — Marseille", department: "Bouches-du-Rhone (13)", vegetation: "garrigue", riskLevel: "high", odds: { "7d": 2.4, "30d": 1.6, season: 1.2 }, probability: { "7d": 0.42, "30d": 0.78 }, pool: 15800, activeBets: 47, meteo: { temp: 21.4, humidity: 44, wind: 11, precipitation: 0 }, fwiIndex: 87, geometry: ZONE_GEOMETRIES["ZONE-MRS-001"] || { type: "Polygon", coordinates: [] } },
  { zoneId: "ZONE-EST-001", name: "Massif de l'Esterel", department: "Alpes-Maritimes (06)", vegetation: "maquis", riskLevel: "high", odds: { "7d": 2.0, "30d": 1.5, season: 1.15 }, probability: { "7d": 0.38, "30d": 0.72 }, pool: 19200, activeBets: 63, meteo: { temp: 21.0, humidity: 40, wind: 16, precipitation: 0 }, fwiIndex: 91, geometry: ZONE_GEOMETRIES["ZONE-EST-001"] || { type: "Polygon", coordinates: [] } },
  { zoneId: "ZONE-COR-001", name: "Maquis Porto-Vecchio", department: "Corse-du-Sud (2A)", vegetation: "maquis", riskLevel: "high", odds: { "7d": 1.6, "30d": 1.3, season: 1.1 }, probability: { "7d": 0.40, "30d": 0.75 }, pool: 11500, activeBets: 34, meteo: { temp: 23.8, humidity: 38, wind: 19, precipitation: 0 }, fwiIndex: 93, geometry: ZONE_GEOMETRIES["ZONE-COR-001"] || { type: "Polygon", coordinates: [] } },
  { zoneId: "ZONE-LUB-001", name: "Luberon", department: "Vaucluse (84)", vegetation: "garrigue", riskLevel: "moderate", odds: { "7d": 3.8, "30d": 2.1, season: 1.4 }, probability: { "7d": 0.22, "30d": 0.55 }, pool: 5200, activeBets: 18, meteo: { temp: 19.5, humidity: 48, wind: 12, precipitation: 0 }, fwiIndex: 65, geometry: ZONE_GEOMETRIES["ZONE-LUB-001"] || { type: "Polygon", coordinates: [] } },
  { zoneId: "ZONE-GAR-001", name: "Garrigue du Gard", department: "Gard (30)", vegetation: "garrigue", riskLevel: "high", odds: { "7d": 2.2, "30d": 1.5, season: 1.15 }, probability: { "7d": 0.38, "30d": 0.72 }, pool: 12600, activeBets: 41, meteo: { temp: 20.5, humidity: 42, wind: 14, precipitation: 0 }, fwiIndex: 78, geometry: ZONE_GEOMETRIES["ZONE-GAR-001"] || { type: "Polygon", coordinates: [] } },
  { zoneId: "ZONE-SEINE-001", name: "Bassin Seine - Paris", department: "Paris (75)", vegetation: "urbain", riskLevel: "moderate", odds: { "7d": 3.57, "30d": 2.1, season: 1.4 }, probability: { "7d": 0.28, "30d": 0.48 }, pool: 31200, activeBets: 89, meteo: { temp: 14.2, humidity: 65, wind: 12, precipitation: 2.5 }, fwiIndex: 15, geometry: ZONE_GEOMETRIES["ZONE-SEINE-001"] || { type: "Polygon", coordinates: [] } },
  { zoneId: "ZONE-RHONE-001", name: "Bassin Rhone - Beaucaire", department: "Gard (30)", vegetation: "plaine_alluviale", riskLevel: "high", odds: { "7d": 1.41, "30d": 1.15, season: 1.05 }, probability: { "7d": 0.71, "30d": 0.87 }, pool: 22800, activeBets: 63, meteo: { temp: 17.8, humidity: 58, wind: 15, precipitation: 5.2 }, fwiIndex: 10, geometry: ZONE_GEOMETRIES["ZONE-RHONE-001"] || { type: "Polygon", coordinates: [] } },
];

function parseFirestoreZone(id: string, data: Record<string, unknown>): BettingZone {
  const realGeometry = ZONE_GEOMETRIES[id];
  let geometry: GeoJSON.Polygon;
  if (realGeometry) {
    geometry = realGeometry;
  } else {
    const fsGeom = data.geometry as { type: string; coordinates: string } | undefined;
    let parsedCoords: number[][][] = [];
    if (fsGeom?.coordinates) {
      try { parsedCoords = JSON.parse(fsGeom.coordinates as string); } catch { /* */ }
    }
    geometry = { type: "Polygon", coordinates: parsedCoords };
  }

  const meteo = data.meteo as Record<string, number> | undefined;

  return {
    zoneId: id,
    name: (data.name as string) || "",
    department: (data.department as string) || "",
    vegetation: (data.vegetation as string) || "",
    riskLevel: (data.riskLevel as BettingZone["riskLevel"]) || "moderate",
    odds: {
      "7d": (data.currentOdds7d as number) || 1,
      "30d": (data.currentOdds30d as number) || 1,
      season: (data.currentOddsSeason as number) || 1,
    },
    probability: {
      "7d": (data.fireProbability7d as number) || 0,
      "30d": (data.fireProbability30d as number) || 0,
    },
    pool: (data.totalPool as number) || 0,
    activeBets: (data.activeBets as number) || 0,
    meteo: {
      temp: meteo?.temp || 0,
      humidity: meteo?.humidity || 0,
      wind: meteo?.wind || 0,
      precipitation: meteo?.precipitation || 0,
    },
    fwiIndex: (data.fwiIndex as number) || 0,
    geometry,
  };
}

export function useZones() {
  const [zones, setZones] = useState<BettingZone[]>(FALLBACK_ZONES);
  const [loading, setLoading] = useState(false); // false = show fallback immediately
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"local" | "firestore">("local");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s max

    async function fetchZones() {
      try {
        const snapshot = await getDocs(collection(db, "zones"));
        if (controller.signal.aborted) return;
        const parsed = snapshot.docs.map((doc) =>
          parseFirestoreZone(doc.id, doc.data() as Record<string, unknown>)
        );
        const order = { critical: 0, high: 1, moderate: 2, low: 3 };
        parsed.sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);
        if (parsed.length > 0) {
          setZones(parsed);
          setSource("firestore");
        }
        setError(null);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Firestore unavailable");
        }
        // Keep fallback zones — app still works
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    }

    fetchZones();
    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  return { zones, loading, error, source };
}
