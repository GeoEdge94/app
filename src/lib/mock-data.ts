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

// ─── MOCK BETS (portfolio) ───
export const MOCK_BETS: (Bet & { zoneName: string; zoneRisk: string })[] = [
  {
    betId: "BET-001", userId: "demo", zoneId: "ZONE-VAR-001", zoneName: "Massif des Maures", zoneRisk: "critical",
    horizon: "7d", amount: 250, odds: 1.85, potentialGain: 462,
    status: "active", placedAt: "2026-04-05T14:30:00Z", expiresAt: "2026-04-12T14:30:00Z",
  },
  {
    betId: "BET-002", userId: "demo", zoneId: "ZONE-GIR-001", zoneName: "Foret des Landes", zoneRisk: "critical",
    horizon: "30d", amount: 500, odds: 1.2, potentialGain: 600,
    status: "active", placedAt: "2026-04-01T10:00:00Z", expiresAt: "2026-05-01T10:00:00Z",
  },
  {
    betId: "BET-003", userId: "demo", zoneId: "ZONE-MRS-001", zoneName: "Calanques — Marseille", zoneRisk: "high",
    horizon: "7d", amount: 100, odds: 2.8, potentialGain: 280,
    status: "won", placedAt: "2026-03-20T08:00:00Z", expiresAt: "2026-03-27T08:00:00Z",
  },
  {
    betId: "BET-004", userId: "demo", zoneId: "ZONE-EST-001", zoneName: "Massif de l'Esterel", zoneRisk: "high",
    horizon: "season", amount: 150, odds: 1.15, potentialGain: 172,
    status: "active", placedAt: "2026-04-02T16:00:00Z", expiresAt: "2026-10-31T23:59:00Z",
  },
  {
    betId: "BET-005", userId: "demo", zoneId: "ZONE-LUB-001", zoneName: "Luberon", zoneRisk: "moderate",
    horizon: "7d", amount: 75, odds: 4.2, potentialGain: 315,
    status: "lost", placedAt: "2026-03-15T12:00:00Z", expiresAt: "2026-03-22T12:00:00Z",
  },
  {
    betId: "BET-006", userId: "demo", zoneId: "ZONE-VAR-001", zoneName: "Massif des Maures", zoneRisk: "critical",
    horizon: "30d", amount: 300, odds: 1.35, potentialGain: 405,
    status: "won", placedAt: "2026-03-01T09:00:00Z", expiresAt: "2026-03-31T09:00:00Z",
  },
  {
    betId: "BET-007", userId: "demo", zoneId: "ZONE-COR-001", zoneName: "Maquis Porto-Vecchio", zoneRisk: "high",
    horizon: "7d", amount: 200, odds: 1.65, potentialGain: 330,
    status: "lost", placedAt: "2026-03-25T11:00:00Z", expiresAt: "2026-04-01T11:00:00Z",
  },
];

// ─── PORTFOLIO STATS ───
export function computePortfolioStats(bets: typeof MOCK_BETS) {
  const active = bets.filter((b) => b.status === "active");
  const won = bets.filter((b) => b.status === "won");
  const lost = bets.filter((b) => b.status === "lost");

  const totalInvested = bets.reduce((s, b) => s + b.amount, 0);
  const activeExposure = active.reduce((s, b) => s + b.amount, 0);
  const totalWon = won.reduce((s, b) => s + b.potentialGain, 0);
  const totalLost = lost.reduce((s, b) => s + b.amount, 0);
  const pnl = totalWon - totalLost;
  const roi = totalInvested > 0 ? ((pnl / totalInvested) * 100) : 0;

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
    winRate: bets.length > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0,
  };
}

// ─── P&L HISTORY (30 days) ───
export function generatePnlHistory(days = 30): { date: string; pnl: number; cumulative: number }[] {
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
