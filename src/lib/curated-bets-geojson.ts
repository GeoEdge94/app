import { CURATED_BETS } from "./curated-bets";

const CAT_COLORS: Record<string, string> = {
  hurricane: "#8B5CF6",
  temperature: "#F59E0B",
  earthquake: "#EF4444",
  tornado: "#6B7280",
  fire: "#DC2626",
  flood: "#3B82F6",
  volcano: "#7C3AED",
  co2: "#10B981",
  air_quality: "#06B6D4",
  snow: "#93C5FD",
  drought: "#D97706",
};

export function curatedBetsToGeoJson(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: CURATED_BETS
      .filter((b) => b.coordinates !== null)
      .map((b) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [b.coordinates!.lon, b.coordinates!.lat],
        },
        properties: {
          id: b.id,
          title: b.title,
          platform: b.platform,
          category: b.category,
          probability: Math.round(b.probability * 100),
          volume: b.volume,
          active: b.active,
          deadline: b.deadline,
          measurable_by: b.measurable_by,
          data_layer: b.data_layer,
          ai_analysis: b.ai_analysis,
          confidence: b.confidence,
          resolution_source: b.resolution_source,
          url: b.url,
          color: CAT_COLORS[b.category] || "#6B7280",
        },
      })),
  };
}
