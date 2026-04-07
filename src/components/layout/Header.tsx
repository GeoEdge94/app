"use client";

import { Moon, Sun, Wallet, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/stores/useMapStore";
import { useWalletStore } from "@/lib/wallet";

export function Header() {
  const { darkMode, toggleDarkMode } = useMapStore();
  const balance = useWalletStore((s) => s.balance);

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-background/95 backdrop-blur-lg z-40 shrink-0">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <span className="text-base font-bold tracking-tight">
          Geo<span className="text-primary">Edge</span>
        </span>
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1">
        {["Zones", "Portfolio", "Simulator"].map((item) => (
          <button
            key={item}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {/* Balance */}
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
          <Wallet className="h-3 w-3 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {balance.toLocaleString()} EUR
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleDarkMode}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
