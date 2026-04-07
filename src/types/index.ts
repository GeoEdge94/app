export interface FirePoint {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: string;
  frp: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
}

export interface BettingZone {
  zoneId: string;
  name: string;
  department: string;
  vegetation: string;
  riskLevel: "low" | "moderate" | "high" | "critical";
  odds: { "7d": number; "30d": number; season: number };
  probability: { "7d": number; "30d": number };
  pool: number;
  activeBets: number;
  meteo: { temp: number; humidity: number; wind: number; precipitation: number };
  fwiIndex: number;
  geometry: GeoJSON.Polygon;
}

export interface Bet {
  betId: string;
  userId: string;
  zoneId: string;
  horizon: "7d" | "30d" | "season";
  amount: number;
  odds: number;
  potentialGain: number;
  status: "active" | "won" | "lost" | "cancelled";
  placedAt: string;
  expiresAt: string;
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type MapLayer = "zones" | "fires" | "cadastre" | "satellite" | "risk" | "rivers" | "vigilance" | "markets";
