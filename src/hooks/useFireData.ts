"use client";

import { useState, useEffect } from "react";

export function useFireData() {
  const [fires, setFires] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/data/fires_france_real.geojson");
        if (!res.ok) throw new Error("Failed to load fire data");
        const data: GeoJSON.FeatureCollection = await res.json();
        setFires(data);
        setCount(data.features.length);
      } catch {
        setFires(null);
        setCount(0);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { fires, loading, count };
}
