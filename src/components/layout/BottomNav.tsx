"use client";

import { Map, BarChart3, Calculator, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "map", label: "Carte", icon: Map },
  { id: "portfolio", label: "Portfolio", icon: BarChart3 },
  { id: "simulator", label: "Simuler", icon: Calculator },
  { id: "account", label: "Compte", icon: User },
] as const;

export type Tab = (typeof tabs)[number]["id"];

export function BottomNav({ active, onTabChange }: { active: Tab; onTabChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
              active === tab.id
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
