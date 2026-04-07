import { MARKETS, type PredictionMarket } from "./markets-data";

export function marketsToGeoJson(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = MARKETS
    .filter((m) => m.coordinates)
    .map((m) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [m.coordinates!.lon, m.coordinates!.lat],
      },
      properties: {
        id: m.id,
        title: m.title,
        category: m.category,
        type: m.type,
        yesPrice: m.yesPrice,
        yesPercent: Math.round(m.yesPrice * 100),
        volume: m.volume,
        participants: m.participants,
        department: m.department || "",
        daysLeft: Math.max(0, Math.ceil((new Date(m.deadline).getTime() - Date.now()) / 86400000)),
        status: m.status,
      },
    }));

  // Also add markets without coordinates but with departments (use dept centroids)
  const deptCentroids: Record<string, [number, number]> = {
    "83": [6.21, 43.46], "13": [5.07, 43.53], "06": [7.12, 43.94],
    "30": [4.17, 43.96], "34": [3.42, 43.59], "84": [5.14, 44.05],
    "33": [-0.68, 44.84], "2A": [8.98, 41.87], "11": [2.41, 43.10],
    "47": [0.62, 44.35], "07": [4.60, 44.72], "2B": [9.19, 42.33],
  };

  MARKETS
    .filter((m) => !m.coordinates && m.department && deptCentroids[m.department])
    .forEach((m) => {
      const [lon, lat] = deptCentroids[m.department!];
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        properties: {
          id: m.id,
          title: m.title,
          category: m.category,
          type: m.type,
          yesPrice: m.yesPrice,
          yesPercent: Math.round(m.yesPrice * 100),
          volume: m.volume,
          participants: m.participants,
          department: m.department || "",
          daysLeft: Math.max(0, Math.ceil((new Date(m.deadline).getTime() - Date.now()) / 86400000)),
          status: m.status,
        },
      });
    });

  return { type: "FeatureCollection", features };
}
