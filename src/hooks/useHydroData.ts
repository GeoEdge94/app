"use client";

import { useState, useEffect } from "react";

export function useHydroData() {
  const [rivers, setRivers] = useState<GeoJSON.FeatureCollection | null>(null);
  const [vigilance, setVigilance] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [rRes, vRes] = await Promise.allSettled([
        fetch("/data/hubeau_rivers.geojson").then((r) => r.ok ? r.json() : null),
        fetch("/data/vigilance_departments.geojson").then((r) => r.ok ? r.json() : null),
      ]);
      if (rRes.status === "fulfilled" && rRes.value) setRivers(rRes.value);
      if (vRes.status === "fulfilled" && vRes.value) setVigilance(vRes.value);
      setLoading(false);
    }
    load();
  }, []);

  return { rivers, vigilance, loading };
}
