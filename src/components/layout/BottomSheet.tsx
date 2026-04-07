"use client";

import { useRef, useCallback, useEffect, type ReactNode } from "react";
import { useMapStore } from "@/stores/useMapStore";

// Snap positions as % of viewport height from bottom
// e.g. collapsed = sheet top is at 92vh (only 8vh visible)
const SNAP = { collapsed: 92, half: 45, full: 10 } as const;

interface BottomSheetProps {
  children: ReactNode;
  peekContent?: ReactNode;
}

export function BottomSheet({ children, peekContent }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startY: 0, startTop: 0, lastY: 0, velocity: 0 });
  const { sheetSnap, setSheetSnap } = useMapStore();

  const snapToVh = (s: typeof sheetSnap) => SNAP[s];

  // Apply position (top as vh%)
  const applyPosition = useCallback((topVh: number, animate = false) => {
    const el = sheetRef.current;
    if (!el) return;
    if (animate) {
      el.style.transition = "top 0.35s cubic-bezier(0.32, 0.72, 0, 1)";
    } else {
      el.style.transition = "none";
    }
    el.style.top = `${topVh}vh`;
  }, []);

  // Snap to position
  const snapTo = useCallback((snap: "collapsed" | "half" | "full") => {
    setSheetSnap(snap);
    applyPosition(snapToVh(snap), true);
  }, [setSheetSnap, applyPosition]);

  // ─── TOUCH HANDLERS ───
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = sheetRef.current;
    if (!el) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const topVh = (rect.top / window.innerHeight) * 100;
    drag.current = { active: true, startY: e.clientY, startTop: topVh, lastY: e.clientY, velocity: 0 };
    el.style.transition = "none";
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active || !sheetRef.current) return;
    const dy = e.clientY - drag.current.startY;
    const dyVh = (dy / window.innerHeight) * 100;
    const newTop = Math.max(SNAP.full - 5, Math.min(SNAP.collapsed + 3, drag.current.startTop + dyVh));
    sheetRef.current.style.top = `${newTop}vh`;
    // Track velocity
    drag.current.velocity = e.clientY - drag.current.lastY;
    drag.current.lastY = e.clientY;
  }, []);

  const onPointerUp = useCallback(() => {
    if (!drag.current.active || !sheetRef.current) return;
    drag.current.active = false;
    const rect = sheetRef.current.getBoundingClientRect();
    const topVh = (rect.top / window.innerHeight) * 100;
    const v = drag.current.velocity;

    // Fast flick down → collapse
    if (v > 8) { snapTo("collapsed"); return; }
    // Fast flick up → full
    if (v < -8) { snapTo("full"); return; }

    // Otherwise snap to nearest
    const dists = [
      { snap: "collapsed" as const, d: Math.abs(topVh - SNAP.collapsed) },
      { snap: "half" as const, d: Math.abs(topVh - SNAP.half) },
      { snap: "full" as const, d: Math.abs(topVh - SNAP.full) },
    ];
    dists.sort((a, b) => a.d - b.d);
    snapTo(dists[0].snap);
  }, [snapTo]);

  // Sync from store (programmatic changes)
  useEffect(() => {
    if (drag.current.active) return;
    applyPosition(snapToVh(sheetSnap), true);
  }, [sheetSnap, applyPosition]);

  const isCollapsed = sheetSnap === "collapsed";

  return (
    <>
      {/* Desktop panel */}
      <aside className="hidden md:flex md:w-[380px] md:relative md:h-full bg-background border-l border-border z-30 flex-col">
        {children}
      </aside>

      {/* Mobile bottom sheet */}
      <div
        ref={sheetRef}
        className="md:hidden fixed left-0 right-0 z-30 flex flex-col bg-background rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)]"
        style={{
          top: `${snapToVh(sheetSnap)}vh`,
          bottom: "56px", // above bottom nav
          willChange: "top",
        }}
      >
        {/* Drag zone — large touch target */}
        <div
          className="flex flex-col items-center cursor-grab active:cursor-grabbing select-none shrink-0"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: "none" }}
        >
          {/* Handle pill */}
          <div className="pt-3 pb-2">
            <div className="w-9 h-[5px] rounded-full bg-muted-foreground/20" />
          </div>

          {/* Peek content when collapsed */}
          {isCollapsed && peekContent && (
            <div className="w-full px-4 pb-2">{peekContent}</div>
          )}
        </div>

        {/* Scrollable content */}
        <div className={`flex-1 overflow-y-auto overscroll-contain ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"} transition-opacity duration-200`}>
          {children}
        </div>
      </div>
    </>
  );
}
