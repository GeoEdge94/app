/**
 * Geographic zones for prediction markets.
 * Each zone is a polygon representing the area covered by a market.
 * Shapes follow real department/basin contours (simplified).
 */

import type { MarketCategory } from "./markets-data";

interface MarketZone {
  marketId: string;
  category: MarketCategory;
  label: string;
  yesPercent: number;
  geometry: GeoJSON.Polygon;
}

export const MARKET_ZONES: MarketZone[] = [
  // ── FLOOD: Seine at Paris basin ──
  {
    marketId: "MKT-002", category: "flood", label: "Seine Paris 28%", yesPercent: 28,
    geometry: { type: "Polygon", coordinates: [[[2.25,48.82],[2.30,48.81],[2.35,48.82],[2.40,48.83],[2.42,48.85],[2.40,48.87],[2.38,48.88],[2.35,48.87],[2.30,48.86],[2.27,48.85],[2.25,48.83],[2.25,48.82]]] },
  },
  // ── FLOOD: Rhone at Beaucaire ──
  {
    marketId: "MKT-004", category: "flood", label: "Rhone 71%", yesPercent: 71,
    geometry: { type: "Polygon", coordinates: [[[4.55,43.72],[4.62,43.71],[4.70,43.73],[4.73,43.77],[4.72,43.82],[4.68,43.86],[4.62,43.87],[4.56,43.85],[4.52,43.82],[4.51,43.78],[4.53,43.74],[4.55,43.72]]] },
  },
  // ── RAIN: Nice zone ──
  {
    marketId: "MKT-006", category: "rain", label: "Nice 12%", yesPercent: 12,
    geometry: { type: "Polygon", coordinates: [[[7.18,43.66],[7.23,43.65],[7.28,43.66],[7.32,43.68],[7.33,43.71],[7.31,43.74],[7.27,43.76],[7.22,43.75],[7.18,43.73],[7.16,43.70],[7.17,43.68],[7.18,43.66]]] },
  },
  // ── RAIN: Gard cevenol ──
  {
    marketId: "MKT-009", category: "rain", label: "Gard 31%", yesPercent: 31,
    geometry: { type: "Polygon", coordinates: [[[3.85,43.72],[3.95,43.68],[4.10,43.65],[4.25,43.68],[4.35,43.72],[4.40,43.80],[4.38,43.90],[4.30,43.98],[4.18,44.02],[4.05,44.00],[3.92,43.95],[3.85,43.88],[3.82,43.80],[3.85,43.72]]] },
  },
  // ── STORM: Var department ──
  {
    marketId: "MKT-012", category: "storm", label: "Var vigilance 85%", yesPercent: 85,
    geometry: { type: "Polygon", coordinates: [[[5.75,43.25],[5.85,43.20],[6.00,43.18],[6.20,43.20],[6.40,43.25],[6.55,43.30],[6.65,43.38],[6.70,43.45],[6.65,43.52],[6.50,43.56],[6.30,43.58],[6.10,43.55],[5.90,43.50],[5.78,43.44],[5.72,43.38],[5.73,43.30],[5.75,43.25]]] },
  },
  // ── FIRE: Bouches-du-Rhone hotspot ──
  {
    marketId: "MKT-016", category: "fire", label: "BdR EFFIS 67%", yesPercent: 67,
    geometry: { type: "Polygon", coordinates: [[[4.85,43.20],[4.95,43.18],[5.10,43.17],[5.25,43.18],[5.40,43.22],[5.50,43.28],[5.55,43.35],[5.52,43.42],[5.42,43.48],[5.30,43.52],[5.15,43.53],[5.00,43.50],[4.88,43.45],[4.82,43.38],[4.80,43.30],[4.83,43.24],[4.85,43.20]]] },
  },
  // ── FIRE: Aude burnt area ──
  {
    marketId: "MKT-017", category: "fire", label: "Aude EFFIS 15%", yesPercent: 15,
    geometry: { type: "Polygon", coordinates: [[[1.85,42.92],[2.00,42.88],[2.20,42.85],[2.40,42.88],[2.55,42.95],[2.65,43.05],[2.68,43.15],[2.60,43.22],[2.45,43.25],[2.30,43.22],[2.15,43.18],[2.00,43.12],[1.90,43.05],[1.85,42.98],[1.85,42.92]]] },
  },
  // ── CATNAT: Gard secheresse ──
  {
    marketId: "MKT-019", category: "catnat", label: "Gard CatNat 44%", yesPercent: 44,
    geometry: { type: "Polygon", coordinates: [[[3.85,43.72],[3.98,43.68],[4.12,43.66],[4.28,43.70],[4.38,43.78],[4.42,43.88],[4.35,43.98],[4.22,44.05],[4.08,44.08],[3.95,44.05],[3.85,43.98],[3.80,43.88],[3.82,43.78],[3.85,43.72]]] },
  },
];

export function marketZonesToGeoJson(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: MARKET_ZONES.map((z) => ({
      type: "Feature" as const,
      geometry: z.geometry,
      properties: {
        marketId: z.marketId,
        category: z.category,
        label: z.label,
        yesPercent: z.yesPercent,
      },
    })),
  };
}
