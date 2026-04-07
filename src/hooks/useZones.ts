"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BettingZone } from "@/types";

function parseFirestoreZone(id: string, data: Record<string, unknown>): BettingZone {
  const geometry = data.geometry as { type: string; coordinates: string } | undefined;
  let parsedCoords: number[][][] = [];
  if (geometry?.coordinates) {
    try {
      parsedCoords = JSON.parse(geometry.coordinates as string);
    } catch {
      parsedCoords = [];
    }
  }

  const meteo = data.meteo as Record<string, number> | undefined;
  const bbox = data.bbox as Record<string, number> | undefined;

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
    geometry: {
      type: "Polygon",
      coordinates: parsedCoords,
    },
  };
}

export function useZones() {
  const [zones, setZones] = useState<BettingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchZones() {
      try {
        const snapshot = await getDocs(collection(db, "zones"));
        const parsed = snapshot.docs.map((doc) =>
          parseFirestoreZone(doc.id, doc.data() as Record<string, unknown>)
        );
        // Sort by risk: critical first
        const order = { critical: 0, high: 1, moderate: 2, low: 3 };
        parsed.sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);
        setZones(parsed);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch zones");
      } finally {
        setLoading(false);
      }
    }
    fetchZones();
  }, []);

  return { zones, loading, error };
}
