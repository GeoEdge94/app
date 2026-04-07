"use client";

import { Moon, Sun, Wallet, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/stores/useMapStore";

export function Header() {
  const { darkMode, toggleDarkMode } = useMapStore();

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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleDarkMode}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button size="sm" className="h-8 text-xs gap-1.5 hidden sm:flex">
          <Wallet className="h-3.5 w-3.5" />
          Connect
        </Button>
      </div>
    </header>
  );
}
