import type { RiskLevel } from "@/types";

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#10B981",
  moderate: "#F59E0B",
  high: "#EF4444",
  critical: "#7C3AED",
};

export const RISK_BG: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  critical: "bg-purple-100 text-purple-700",
};

export const RISK_FILL_OPACITY = 0.25;
export const RISK_LINE_WIDTH = 2;

export function riskToOddsColor(probability: number): string {
  if (probability < 0.2) return "#15803D";
  if (probability < 0.4) return "#4ADE80";
  if (probability < 0.6) return "#FBBF24";
  if (probability < 0.8) return "#F97316";
  return "#B91C1C";
}
