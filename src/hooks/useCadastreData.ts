"use client";

import { useState, useEffect } from "react";

export function useCadastreData() {
  const [cadastre, setCadastre] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/data/cadastre_zones.geojson");
        if (!res.ok) throw new Error("No cadastre data");
        const data: GeoJSON.FeatureCollection = await res.json();
        setCadastre(data);
        setCount(data.features.length);
      } catch {
        setCadastre(null);
        setCount(0);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { cadastre, loading, count };
}
