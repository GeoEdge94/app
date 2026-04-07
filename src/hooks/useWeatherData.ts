"use client";

import { useState, useEffect } from "react";

interface ZoneWeather {
  temp: number;
  humidity: number;
  wind: number;
  precipitation: number;
}

interface ZoneCoords {
  zoneId: string;
  lat: number;
  lon: number;
}

const ZONE_COORDS: ZoneCoords[] = [
  { zoneId: "ZONE-VAR-001", lat: 43.36, lon: 6.49 },
  { zoneId: "ZONE-GIR-001", lat: 44.585, lon: -1.125 },
  { zoneId: "ZONE-MRS-001", lat: 43.24, lon: 5.40 },
  { zoneId: "ZONE-EST-001", lat: 43.52, lon: 6.915 },
  { zoneId: "ZONE-COR-001", lat: 41.59, lon: 9.29 },
  { zoneId: "ZONE-LUB-001", lat: 43.885, lon: 5.405 },
];

export function useWeatherData() {
  const [weather, setWeather] = useState<Record<string, ZoneWeather>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const lats = ZONE_COORDS.map((z) => z.lat).join(",");
        const lons = ZONE_COORDS.map((z) => z.lon).join(",");

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=auto`
        );

        if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

        const data = await res.json();

        const result: Record<string, ZoneWeather> = {};

        // Open-Meteo returns array when multiple coords
        const items = Array.isArray(data) ? data : [data];

        items.forEach((item: Record<string, unknown>, i: number) => {
          const current = item.current as Record<string, number> | undefined;
          if (current && ZONE_COORDS[i]) {
            result[ZONE_COORDS[i].zoneId] = {
              temp: Math.round(current.temperature_2m * 10) / 10,
              humidity: Math.round(current.relative_humidity_2m),
              wind: Math.round(current.wind_speed_10m * 10) / 10,
              precipitation: Math.round(current.precipitation * 10) / 10,
            };
          }
        });

        setWeather(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Weather fetch failed");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { weather, loading, error };
}
