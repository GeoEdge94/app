import type { Bet } from "@/types";

// ─── ODDS HISTORY (14 days, per zone) ───
export function generateOddsHistory(baseOdds: number, days = 14): { date: string; odds: number; volume: number; probability: number }[] {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const drift = (Math.random() - 0.45) * 0.15;
    const odds = Math.max(1.05, baseOdds + drift * (days - i) * 0.3);
    const prob = Math.min(0.95, 1 / odds);
    const volume = Math.round(800 + Math.random() * 4000 + (i > days - 4 ? 3000 : 0));
    return {
      date: d.toISOString().slice(0, 10),
      odds: Math.round(odds * 100) / 100,
      volume,
      probability: Math.round(prob * 1000) / 10,
    };
  });
}

// ─── EXTENDED MOCK BETS (fire zones + prediction markets) ───
export interface ExtendedBet extends Bet {
  zoneName: string;
  zoneRisk: string;
  category: "fire" | "flood" | "rain" | "storm" | "catnat";
  marketId?: string;
  resolutionSource?: string;
  coordinates?: { lat: number; lon: number };
  oddsHistory: { date: string; odds: number }[];
}

export const MOCK_BETS: ExtendedBet[] = [
  // Fire zone bets
  {
    betId: "BET-001", userId: "demo", zoneId: "ZONE-VAR-001", zoneName: "Massif des Maures", zoneRisk: "critical",
    category: "fire", horizon: "7d", amount: 250, odds: 1.85, potentialGain: 462,
    status: "active", placedAt: "2026-04-05T14:30:00Z", expiresAt: "2026-04-12T14:30:00Z",
    coordinates: { lat: 43.36, lon: 6.49 },
    oddsHistory: [{ date: "04-05", odds: 1.92 }, { date: "04-06", odds: 1.88 }, { date: "04-07", odds: 1.85 }],
  },
  {
    betId: "BET-002", userId: "demo", zoneId: "ZONE-GIR-001", zoneName: "Foret des Landes", zoneRisk: "critical",
    category: "fire", horizon: "30d", amount: 500, odds: 1.2, potentialGain: 600,
    status: "active", placedAt: "2026-04-01T10:00:00Z", expiresAt: "2026-05-01T10:00:00Z",
    coordinates: { lat: 44.585, lon: -1.125 },
    oddsHistory: [{ date: "04-01", odds: 1.25 }, { date: "04-03", odds: 1.22 }, { date: "04-05", odds: 1.20 }, { date: "04-07", odds: 1.20 }],
  },
  {
    betId: "BET-003", userId: "demo", zoneId: "ZONE-MRS-001", zoneName: "Calanques — Marseille", zoneRisk: "high",
    category: "fire", horizon: "7d", amount: 100, odds: 2.8, potentialGain: 280,
    status: "won", placedAt: "2026-03-20T08:00:00Z", expiresAt: "2026-03-27T08:00:00Z",
    resolutionSource: "FIRMS detection 2026-03-24",
    coordinates: { lat: 43.24, lon: 5.4 },
    oddsHistory: [{ date: "03-20", odds: 2.80 }, { date: "03-22", odds: 2.50 }, { date: "03-24", odds: 1.10 }],
  },
  // Prediction market bets
  {
    betId: "BET-008", userId: "demo", zoneId: "MKT-001", zoneName: "Vigilance crues orange/rouge avril", zoneRisk: "high",
    category: "flood", marketId: "MKT-001", horizon: "30d", amount: 180, odds: 1.61, potentialGain: 290,
    status: "active", placedAt: "2026-04-03T09:00:00Z", expiresAt: "2026-04-30T16:00:00Z",
    resolutionSource: "Vigicrues bulletin national",
    oddsHistory: [{ date: "04-03", odds: 1.55 }, { date: "04-05", odds: 1.58 }, { date: "04-07", odds: 1.61 }],
  },
  {
    betId: "BET-009", userId: "demo", zoneId: "MKT-002", zoneName: "Seine Paris > 3.20m", zoneRisk: "moderate",
    category: "flood", marketId: "MKT-002", horizon: "30d", amount: 120, odds: 3.57, potentialGain: 428,
    status: "active", placedAt: "2026-04-06T11:00:00Z", expiresAt: "2026-05-15T23:59:00Z",
    resolutionSource: "Hub'Eau Paris-Austerlitz",
    coordinates: { lat: 48.8422, lon: 2.3654 },
    oddsHistory: [{ date: "04-06", odds: 3.45 }, { date: "04-07", odds: 3.57 }],
  },
  {
    betId: "BET-010", userId: "demo", zoneId: "MKT-012", zoneName: "Var vigilance Pluie-Inondation", zoneRisk: "high",
    category: "storm", marketId: "MKT-012", horizon: "season", amount: 350, odds: 1.18, potentialGain: 413,
    status: "active", placedAt: "2026-04-02T14:00:00Z", expiresAt: "2026-09-30T23:59:00Z",
    resolutionSource: "Vigilance Meteo-France",
    coordinates: { lat: 43.46, lon: 6.21 },
    oddsHistory: [{ date: "04-02", odds: 1.20 }, { date: "04-04", odds: 1.19 }, { date: "04-06", odds: 1.18 }],
  },
  {
    betId: "BET-011", userId: "demo", zoneId: "MKT-016", zoneName: "EFFIS hotspot Bouches-du-Rhone", zoneRisk: "high",
    category: "fire", marketId: "MKT-016", horizon: "7d", amount: 200, odds: 1.49, potentialGain: 298,
    status: "active", placedAt: "2026-04-07T08:00:00Z", expiresAt: "2026-04-14T23:59:00Z",
    resolutionSource: "EFFIS Active Fires MODIS/VIIRS",
    coordinates: { lat: 43.53, lon: 5.07 },
    oddsHistory: [{ date: "04-07", odds: 1.49 }],
  },
  {
    betId: "BET-012", userId: "demo", zoneId: "MKT-014", zoneName: "Tempete nommee France", zoneRisk: "moderate",
    category: "storm", marketId: "MKT-014", horizon: "season", amount: 400, odds: 1.28, potentialGain: 512,
    status: "active", placedAt: "2026-04-01T10:00:00Z", expiresAt: "2027-03-31T23:59:00Z",
    resolutionSource: "Vigilance Meteo-France rouge",
    oddsHistory: [{ date: "04-01", odds: 1.30 }, { date: "04-04", odds: 1.29 }, { date: "04-07", odds: 1.28 }],
  },
  // Resolved bets
  {
    betId: "BET-004", userId: "demo", zoneId: "ZONE-EST-001", zoneName: "Massif de l'Esterel", zoneRisk: "high",
    category: "fire", horizon: "season", amount: 150, odds: 1.15, potentialGain: 172,
    status: "active", placedAt: "2026-04-02T16:00:00Z", expiresAt: "2026-10-31T23:59:00Z",
    coordinates: { lat: 43.52, lon: 6.915 },
    oddsHistory: [{ date: "04-02", odds: 1.18 }, { date: "04-04", odds: 1.16 }, { date: "04-07", odds: 1.15 }],
  },
  {
    betId: "BET-005", userId: "demo", zoneId: "ZONE-LUB-001", zoneName: "Luberon", zoneRisk: "moderate",
    category: "fire", horizon: "7d", amount: 75, odds: 4.2, potentialGain: 315,
    status: "lost", placedAt: "2026-03-15T12:00:00Z", expiresAt: "2026-03-22T12:00:00Z",
    coordinates: { lat: 43.885, lon: 5.405 },
    oddsHistory: [{ date: "03-15", odds: 4.20 }, { date: "03-18", odds: 4.30 }, { date: "03-22", odds: 4.50 }],
  },
  {
    betId: "BET-006", userId: "demo", zoneId: "ZONE-VAR-001", zoneName: "Massif des Maures", zoneRisk: "critical",
    category: "fire", horizon: "30d", amount: 300, odds: 1.35, potentialGain: 405,
    status: "won", placedAt: "2026-03-01T09:00:00Z", expiresAt: "2026-03-31T09:00:00Z",
    resolutionSource: "FIRMS multi-detection 2026-03-18",
    coordinates: { lat: 43.36, lon: 6.49 },
    oddsHistory: [{ date: "03-01", odds: 1.35 }, { date: "03-10", odds: 1.30 }, { date: "03-15", odds: 1.20 }, { date: "03-18", odds: 1.02 }],
  },
  {
    betId: "BET-007", userId: "demo", zoneId: "ZONE-COR-001", zoneName: "Maquis Porto-Vecchio", zoneRisk: "high",
    category: "fire", horizon: "7d", amount: 200, odds: 1.65, potentialGain: 330,
    status: "lost", placedAt: "2026-03-25T11:00:00Z", expiresAt: "2026-04-01T11:00:00Z",
    coordinates: { lat: 41.59, lon: 9.29 },
    oddsHistory: [{ date: "03-25", odds: 1.65 }, { date: "03-28", odds: 1.70 }, { date: "04-01", odds: 1.80 }],
  },
  {
    betId: "BET-013", userId: "demo", zoneId: "MKT-008", zoneName: "3+ depts vigilance orange Orages", zoneRisk: "moderate",
    category: "rain", marketId: "MKT-008", horizon: "7d", amount: 80, odds: 2.22, potentialGain: 177,
    status: "won", placedAt: "2026-03-28T10:00:00Z", expiresAt: "2026-04-04T23:59:00Z",
    resolutionSource: "Vigilance Meteo-France — 4 depts orange 04-02",
    oddsHistory: [{ date: "03-28", odds: 2.22 }, { date: "03-31", odds: 1.80 }, { date: "04-02", odds: 1.05 }],
  },
];

// ─── PORTFOLIO STATS ───
export function computePortfolioStats(bets: ExtendedBet[]) {
  const active = bets.filter((b) => b.status === "active");
  const won = bets.filter((b) => b.status === "won");
  const lost = bets.filter((b) => b.status === "lost");
  const resolved = [...won, ...lost];

  const totalInvested = bets.reduce((s, b) => s + b.amount, 0);
  const activeExposure = active.reduce((s, b) => s + b.amount, 0);
  const totalWon = won.reduce((s, b) => s + b.potentialGain, 0);
  const totalLost = lost.reduce((s, b) => s + b.amount, 0);
  const pnl = totalWon - totalLost;
  const roi = totalInvested > 0 ? ((pnl / totalInvested) * 100) : 0;

  const byCategory = {
    fire: bets.filter((b) => b.category === "fire").length,
    flood: bets.filter((b) => b.category === "flood").length,
    rain: bets.filter((b) => b.category === "rain").length,
    storm: bets.filter((b) => b.category === "storm").length,
    catnat: bets.filter((b) => b.category === "catnat").length,
  };

  return {
    totalBets: bets.length,
    activeBets: active.length,
    wonBets: won.length,
    lostBets: lost.length,
    totalInvested,
    activeExposure,
    totalWon,
    totalLost,
    pnl,
    roi: Math.round(roi * 10) / 10,
    winRate: resolved.length > 0 ? Math.round((won.length / resolved.length) * 100) : 0,
    byCategory,
    avgOdds: bets.length > 0 ? Math.round((bets.reduce((s, b) => s + b.odds, 0) / bets.length) * 100) / 100 : 0,
    biggestWin: won.length > 0 ? Math.max(...won.map((b) => b.potentialGain - b.amount)) : 0,
    biggestLoss: lost.length > 0 ? Math.max(...lost.map((b) => b.amount)) : 0,
  };
}

// ─── P&L HISTORY (60 days) ───
export function generatePnlHistory(days = 60): { date: string; pnl: number; cumulative: number }[] {
  let cum = 0;
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const daily = Math.round((Math.random() - 0.4) * 120);
    cum += daily;
    return { date: d.toISOString().slice(0, 10), pnl: daily, cumulative: cum };
  });
}

// ─── ACTIVE BETS as GeoJSON for map ───
export function activeBetsToGeoJson(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: MOCK_BETS
      .filter((b) => b.status === "active" && b.coordinates)
      .map((b) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [b.coordinates!.lon, b.coordinates!.lat] },
        properties: {
          betId: b.betId,
          zoneName: b.zoneName,
          category: b.category,
          amount: b.amount,
          odds: b.odds,
          potentialGain: b.potentialGain,
          horizon: b.horizon,
          expiresAt: b.expiresAt,
        },
      })),
  };
}
