"use client";

import { Badge } from "@/components/ui/badge";
import { RISK_BG } from "@/lib/risk-colors";
import type { RiskLevel } from "@/types";

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <Badge variant="outline" className={`${RISK_BG[level]} border-0 text-[10px] font-semibold uppercase tracking-wider`}>
      {level}
    </Badge>
  );
}
