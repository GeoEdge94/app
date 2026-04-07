// ── Demo User Profile ─────────────────────────────────────────────
// Complete mock profile for the GeoEdge prediction market demo.
// Used by AccountPanel when the demo user is logged in.

// ── Types ─────────────────────────────────────────────────────────

export interface DemoProfile {
  uid: string;
  email: string;
  displayName: string;
  avatar: string; // initials
  memberSince: string;
  tier: "bronze" | "silver" | "gold" | "platinum";

  // Wallet
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;

  // Stats
  totalBets: number;
  activeBets: number;
  wonBets: number;
  lostBets: number;
  expiredBets: number;
  winRate: number;
  pnl: number;
  roi: number;
  avgOdds: number;
  bestStreak: number;
  currentStreak: number;
  biggestWin: number;
  biggestLoss: number;

  // Category breakdown
  categoryStats: Record<string, { bets: number; wins: number; pnl: number }>;

  // Achievements
  achievements: {
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
  }[];

  // Preferences
  watchedZones: string[];
  favoriteCategories: string[];
  notifications: { telegram: boolean; email: boolean; push: boolean };
}

export interface DemoTransaction {
  id: string;
  type: "deposit" | "withdraw" | "bet_placed" | "bet_won" | "bet_lost" | "bet_refund";
  amount: number;
  description: string;
  timestamp: string;
  betId?: string;
}

export interface DemoBet {
  betId: string;
  marketTitle: string;
  platform: string;
  category: string;
  amount: number;
  odds: number;
  potentialPayout: number;
  status: "won" | "lost" | "active" | "expired";
  placedAt: string;
  resolvedAt?: string;
  resolution?: string;
  pnl: number;
}

// ── Demo Profile ──────────────────────────────────────────────────

export const DEMO_PROFILE: DemoProfile = {
  uid: "demo-geoedge-001",
  email: "demo@geoedge.app",
  displayName: "Marc Durand",
  avatar: "MD",
  memberSince: "2026-01-08T10:30:00Z",
  tier: "gold",

  // Wallet
  balance: 12_847,
  totalDeposited: 15_000,
  totalWithdrawn: 2_153,

  // Stats
  totalBets: 47,
  activeBets: 4,
  wonBets: 31,
  lostBets: 12,
  expiredBets: 0,
  winRate: 72.1,
  pnl: 2_847,
  roi: 28.5,
  avgOdds: 1.82,
  bestStreak: 7,
  currentStreak: 3,
  biggestWin: 1_420,
  biggestLoss: 500,

  // Category breakdown
  categoryStats: {
    fire: { bets: 18, wins: 14, pnl: 1_640 },
    temperature: { bets: 12, wins: 8, pnl: 520 },
    flood: { bets: 8, wins: 5, pnl: 380 },
    earthquake: { bets: 5, wins: 2, pnl: -190 },
    tornado: { bets: 4, wins: 2, pnl: 497 },
  },

  // Achievements
  achievements: [
    {
      id: "first-bet",
      name: "Premier Pari",
      description: "Placer votre premier pari sur la plateforme",
      unlockedAt: "2026-01-10T14:22:00Z",
    },
    {
      id: "streak-5",
      name: "Serie de 5",
      description: "Gagner 5 paris consecutifs",
      unlockedAt: "2026-02-03T09:15:00Z",
    },
    {
      id: "profit-1k",
      name: "Club des 1 000",
      description: "Atteindre 1 000 EUR de profit cumule",
      unlockedAt: "2026-02-18T16:45:00Z",
    },
    {
      id: "fire-expert",
      name: "Expert Incendie",
      description: "Gagner 10 paris dans la categorie feux de foret",
      unlockedAt: "2026-03-12T11:30:00Z",
    },
    {
      id: "diversified",
      name: "Diversifie",
      description: "Placer des paris dans 5 categories differentes",
      unlockedAt: "2026-03-20T08:00:00Z",
    },
  ],

  // Preferences
  watchedZones: ["ZONE-VAR-001", "ZONE-MRS-001", "ZONE-SEINE-001"],
  favoriteCategories: ["fire", "flood", "temperature"],
  notifications: { telegram: true, email: true, push: false },
};

// ── Transaction History (25 entries) ──────────────────────────────

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    id: "TX-001",
    type: "deposit",
    amount: 5_000,
    description: "Depot initial — virement bancaire",
    timestamp: "2026-01-08T10:35:00Z",
  },
  {
    id: "TX-002",
    type: "bet_placed",
    amount: -200,
    description: 'Pari OUI sur "Feu de foret dans le Var — Janvier 2026"',
    timestamp: "2026-01-10T14:22:00Z",
    betId: "BET-001",
  },
  {
    id: "TX-003",
    type: "bet_won",
    amount: 360,
    description: 'Gain — "Feu de foret dans le Var — Janvier 2026"',
    timestamp: "2026-01-28T09:00:00Z",
    betId: "BET-001",
  },
  {
    id: "TX-004",
    type: "bet_placed",
    amount: -300,
    description: 'Pari OUI sur "Crue Seine > 4m — Fevrier 2026"',
    timestamp: "2026-01-30T11:15:00Z",
    betId: "BET-002",
  },
  {
    id: "TX-005",
    type: "bet_placed",
    amount: -150,
    description: 'Pari NON sur "Temperature > 15°C Marseille — Fevrier"',
    timestamp: "2026-02-01T08:45:00Z",
    betId: "BET-003",
  },
  {
    id: "TX-006",
    type: "bet_won",
    amount: 255,
    description: 'Gain — "Temperature > 15°C Marseille — Fevrier"',
    timestamp: "2026-02-15T18:00:00Z",
    betId: "BET-003",
  },
  {
    id: "TX-007",
    type: "bet_lost",
    amount: 0,
    description: 'Perte — "Crue Seine > 4m — Fevrier 2026"',
    timestamp: "2026-02-28T23:59:00Z",
    betId: "BET-002",
  },
  {
    id: "TX-008",
    type: "deposit",
    amount: 5_000,
    description: "Depot — virement bancaire",
    timestamp: "2026-03-01T09:00:00Z",
  },
  {
    id: "TX-009",
    type: "bet_placed",
    amount: -500,
    description: 'Pari OUI sur "FIRMS hotspot Var — Mars 2026"',
    timestamp: "2026-03-02T10:30:00Z",
    betId: "BET-004",
  },
  {
    id: "TX-010",
    type: "bet_won",
    amount: 1_420,
    description: 'Gain — "FIRMS hotspot Var — Mars 2026" (x2.84)',
    timestamp: "2026-03-15T12:00:00Z",
    betId: "BET-004",
  },
  {
    id: "TX-011",
    type: "bet_placed",
    amount: -250,
    description: 'Pari OUI sur "Seisme > M3.0 Alpes — Mars 2026"',
    timestamp: "2026-03-05T14:20:00Z",
    betId: "BET-005",
  },
  {
    id: "TX-012",
    type: "bet_lost",
    amount: 0,
    description: 'Perte — "Seisme > M3.0 Alpes — Mars 2026"',
    timestamp: "2026-03-31T23:59:00Z",
    betId: "BET-005",
  },
  {
    id: "TX-013",
    type: "withdraw",
    amount: -2_153,
    description: "Retrait — virement vers compte bancaire",
    timestamp: "2026-03-10T16:00:00Z",
  },
  {
    id: "TX-014",
    type: "bet_placed",
    amount: -400,
    description: 'Pari OUI sur "Tornade confirmee Sud-Ouest — Mars"',
    timestamp: "2026-03-12T09:00:00Z",
    betId: "BET-006",
  },
  {
    id: "TX-015",
    type: "bet_won",
    amount: 720,
    description: 'Gain — "Tornade confirmee Sud-Ouest — Mars"',
    timestamp: "2026-03-25T15:30:00Z",
    betId: "BET-006",
  },
  {
    id: "TX-016",
    type: "deposit",
    amount: 5_000,
    description: "Depot — carte bancaire",
    timestamp: "2026-03-18T10:00:00Z",
  },
  {
    id: "TX-017",
    type: "bet_placed",
    amount: -350,
    description: 'Pari NON sur "Inondation Garonne > seuil orange — Mars"',
    timestamp: "2026-03-20T11:30:00Z",
    betId: "BET-007",
  },
  {
    id: "TX-018",
    type: "bet_won",
    amount: 560,
    description: 'Gain — "Inondation Garonne > seuil orange — Mars"',
    timestamp: "2026-03-31T18:00:00Z",
    betId: "BET-007",
  },
  {
    id: "TX-019",
    type: "bet_placed",
    amount: -300,
    description: 'Pari OUI sur "Temperature record Nimes > 28°C — Avril"',
    timestamp: "2026-04-01T08:00:00Z",
    betId: "BET-008",
  },
  {
    id: "TX-020",
    type: "bet_placed",
    amount: -200,
    description: 'Pari OUI sur "Feu de foret Bouches-du-Rhone — Avril"',
    timestamp: "2026-04-02T13:15:00Z",
    betId: "BET-009",
  },
  {
    id: "TX-021",
    type: "bet_placed",
    amount: -450,
    description: 'Pari NON sur "Seisme > M2.5 Pyrenees — Avril"',
    timestamp: "2026-04-03T09:45:00Z",
    betId: "BET-010",
  },
  {
    id: "TX-022",
    type: "bet_won",
    amount: 480,
    description: 'Gain — "Temperature record Nimes > 28°C — Avril"',
    timestamp: "2026-04-05T20:00:00Z",
    betId: "BET-008",
  },
  {
    id: "TX-023",
    type: "bet_placed",
    amount: -350,
    description: 'Pari OUI sur "3+ hotspots FIRMS Herault — Avril"',
    timestamp: "2026-04-04T10:30:00Z",
    betId: "BET-011",
  },
  {
    id: "TX-024",
    type: "bet_placed",
    amount: -275,
    description: 'Pari OUI sur "Crue Rhone > 3.5m Lyon — Avril"',
    timestamp: "2026-04-05T15:00:00Z",
    betId: "BET-012",
  },
  {
    id: "TX-025",
    type: "bet_lost",
    amount: 0,
    description: 'Perte — "Feu de foret Bouches-du-Rhone — Avril"',
    timestamp: "2026-04-06T23:59:00Z",
    betId: "BET-009",
  },
];

// ── Bet History (12 detailed entries) ─────────────────────────────

export const DEMO_BETS: DemoBet[] = [
  {
    betId: "BET-001",
    marketTitle: "Feu de foret dans le Var — Janvier 2026",
    platform: "GeoEdge",
    category: "fire",
    amount: 200,
    odds: 1.80,
    potentialPayout: 360,
    status: "won",
    placedAt: "2026-01-10T14:22:00Z",
    resolvedAt: "2026-01-28T09:00:00Z",
    resolution:
      "FIRMS a detecte 2 hotspots actifs dans le massif des Maures (Var) le 26 janvier 2026. Seuil de resolution atteint.",
    pnl: 160,
  },
  {
    betId: "BET-002",
    marketTitle: "Crue Seine > 4m a Paris — Fevrier 2026",
    platform: "Polymarket",
    category: "flood",
    amount: 300,
    odds: 2.10,
    potentialPayout: 630,
    status: "lost",
    placedAt: "2026-01-30T11:15:00Z",
    resolvedAt: "2026-02-28T23:59:00Z",
    resolution:
      "Niveau max Seine a Paris en fevrier : 3.42m (station Austerlitz). Seuil de 4m non atteint.",
    pnl: -300,
  },
  {
    betId: "BET-003",
    marketTitle: "Temperature > 15°C a Marseille — Fevrier 2026",
    platform: "Kalshi",
    category: "temperature",
    amount: 150,
    odds: 1.70,
    potentialPayout: 255,
    status: "won",
    placedAt: "2026-02-01T08:45:00Z",
    resolvedAt: "2026-02-15T18:00:00Z",
    resolution:
      "Meteo-France : Tmax 16.8°C enregistree a Marseille-Marignane le 12 fevrier 2026. Pari NON gagnant (pas de depassement prevu cote parieur).",
    pnl: 105,
  },
  {
    betId: "BET-004",
    marketTitle: "FIRMS detecte hotspot dans le Var — Mars 2026",
    platform: "GeoEdge",
    category: "fire",
    amount: 500,
    odds: 2.84,
    potentialPayout: 1_420,
    status: "won",
    placedAt: "2026-03-02T10:30:00Z",
    resolvedAt: "2026-03-15T12:00:00Z",
    resolution:
      "FIRMS a detecte 3 hotspots dans le Var le 15 mars 2026 (confiance > 80%). Plus gros gain du portefeuille.",
    pnl: 920,
  },
  {
    betId: "BET-005",
    marketTitle: "Seisme > M3.0 dans les Alpes — Mars 2026",
    platform: "Metaculus",
    category: "earthquake",
    amount: 250,
    odds: 3.20,
    potentialPayout: 800,
    status: "lost",
    placedAt: "2026-03-05T14:20:00Z",
    resolvedAt: "2026-03-31T23:59:00Z",
    resolution:
      "Aucun seisme > M3.0 enregistre par le ReSIF dans les Alpes en mars 2026. Evenement max : M2.1 pres de Briancon le 18 mars.",
    pnl: -250,
  },
  {
    betId: "BET-006",
    marketTitle: "Tornade confirmee dans le Sud-Ouest — Mars 2026",
    platform: "GeoEdge",
    category: "tornado",
    amount: 400,
    odds: 1.80,
    potentialPayout: 720,
    status: "won",
    placedAt: "2026-03-12T09:00:00Z",
    resolvedAt: "2026-03-25T15:30:00Z",
    resolution:
      "Tornade EF1 confirmee par Keraunos pres de Dax (Landes) le 23 mars 2026. Degats materiels legers.",
    pnl: 320,
  },
  {
    betId: "BET-007",
    marketTitle: "Inondation Garonne > seuil orange — Mars 2026",
    platform: "Manifold",
    category: "flood",
    amount: 350,
    odds: 1.60,
    potentialPayout: 560,
    status: "won",
    placedAt: "2026-03-20T11:30:00Z",
    resolvedAt: "2026-03-31T18:00:00Z",
    resolution:
      "Vigicrues n'a pas declare de vigilance orange sur la Garonne en mars. Pari NON gagnant.",
    pnl: 210,
  },
  {
    betId: "BET-008",
    marketTitle: "Temperature record > 28°C a Nimes — Avril 2026",
    platform: "Kalshi",
    category: "temperature",
    amount: 300,
    odds: 1.60,
    potentialPayout: 480,
    status: "won",
    placedAt: "2026-04-01T08:00:00Z",
    resolvedAt: "2026-04-05T20:00:00Z",
    resolution:
      "Meteo-France : Tmax 29.3°C a Nimes-Garons le 4 avril 2026, record mensuel battu.",
    pnl: 180,
  },
  {
    betId: "BET-009",
    marketTitle: "Feu de foret Bouches-du-Rhone — Avril 2026",
    platform: "GeoEdge",
    category: "fire",
    amount: 200,
    odds: 2.50,
    potentialPayout: 500,
    status: "lost",
    placedAt: "2026-04-02T13:15:00Z",
    resolvedAt: "2026-04-06T23:59:00Z",
    resolution:
      "Aucun hotspot FIRMS detecte dans les Bouches-du-Rhone entre le 2 et le 6 avril 2026.",
    pnl: -200,
  },
  {
    betId: "BET-010",
    marketTitle: "Seisme > M2.5 dans les Pyrenees — Avril 2026",
    platform: "GeoEdge",
    category: "earthquake",
    amount: 450,
    odds: 1.55,
    potentialPayout: 697,
    status: "active",
    placedAt: "2026-04-03T09:45:00Z",
    resolution: undefined,
    pnl: 0,
  },
  {
    betId: "BET-011",
    marketTitle: "3+ hotspots FIRMS dans l'Herault — Avril 2026",
    platform: "GeoEdge",
    category: "fire",
    amount: 350,
    odds: 2.20,
    potentialPayout: 770,
    status: "active",
    placedAt: "2026-04-04T10:30:00Z",
    resolution: undefined,
    pnl: 0,
  },
  {
    betId: "BET-012",
    marketTitle: "Crue Rhone > 3.5m a Lyon — Avril 2026",
    platform: "Manifold",
    category: "flood",
    amount: 275,
    odds: 2.40,
    potentialPayout: 660,
    status: "active",
    placedAt: "2026-04-05T15:00:00Z",
    resolution: undefined,
    pnl: 0,
  },
];

// ── Helpers ───────────────────────────────────────────────────────

/** Tier display config */
export const TIER_CONFIG: Record<
  DemoProfile["tier"],
  { label: string; color: string; bg: string; icon: string }
> = {
  bronze: { label: "Bronze", color: "text-orange-700", bg: "bg-orange-100", icon: "shield" },
  silver: { label: "Silver", color: "text-slate-600", bg: "bg-slate-100", icon: "shield" },
  gold: { label: "Gold", color: "text-amber-600", bg: "bg-amber-100", icon: "crown" },
  platinum: { label: "Platinum", color: "text-violet-600", bg: "bg-violet-100", icon: "gem" },
};

/** Category display config */
export const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  fire: { label: "Incendie", color: "text-orange-600", bg: "bg-orange-50" },
  temperature: { label: "Temperature", color: "text-red-600", bg: "bg-red-50" },
  flood: { label: "Inondation", color: "text-blue-600", bg: "bg-blue-50" },
  earthquake: { label: "Seisme", color: "text-amber-700", bg: "bg-amber-50" },
  tornado: { label: "Tornade", color: "text-purple-600", bg: "bg-purple-50" },
};

/** Achievement icon mapping */
export const ACHIEVEMENT_ICONS: Record<string, string> = {
  "first-bet": "rocket",
  "streak-5": "zap",
  "profit-1k": "banknote",
  "fire-expert": "flame",
  diversified: "layout-grid",
};

/** Check if logged-in user is the demo user */
export function isDemoUser(email?: string): boolean {
  return email === "demo@geoedge.app";
}
