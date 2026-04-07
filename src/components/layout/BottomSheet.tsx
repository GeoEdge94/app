"use client";

import { useRef, useCallback, useEffect, type ReactNode } from "react";
import { useMapStore } from "@/stores/useMapStore";

const SNAP = { collapsed: 92, half: 45, full: 12 } as const;

interface BottomSheetProps {
  children: ReactNode;
  peekContent?: ReactNode;
}

export function BottomSheet({ children, peekContent }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    startY: 0,
    startTop: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    fromHandle: false,
  });
  const { sheetSnap, setSheetSnap } = useMapStore();

  const getTopVh = useCallback(() => {
    if (!sheetRef.current) return SNAP.half;
    return (sheetRef.current.getBoundingClientRect().top / window.innerHeight) * 100;
  }, []);

  const animateTo = useCallback((topVh: number) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = "top 0.32s cubic-bezier(0.32, 0.72, 0, 1)";
    el.style.top = `${topVh}vh`;
  }, []);

  const snapTo = useCallback((snap: "collapsed" | "half" | "full") => {
    setSheetSnap(snap);
    animateTo(SNAP[snap]);
  }, [setSheetSnap, animateTo]);

  // Can we start a sheet drag? Yes if:
  // - touch is on handle area, OR
  // - content is scrolled to top AND moving down
  const canDragSheet = useCallback((fromHandle: boolean, movingDown: boolean) => {
    if (fromHandle) return true;
    const content = contentRef.current;
    if (!content) return false;
    // Content at top + pulling down → drag sheet
    return content.scrollTop <= 0 && movingDown;
  }, []);

  // ─── TOUCH ───
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      const el = sheetRef.current;
      if (!el) return;

      // Check if touch started on handle (first 44px of sheet)
      const sheetRect = el.getBoundingClientRect();
      const touchYInSheet = touch.clientY - sheetRect.top;
      const fromHandle = touchYInSheet < 44;

      drag.current = {
        active: false, // not yet — wait for move to confirm
        startY: touch.clientY,
        startTop: getTopVh(),
        lastY: touch.clientY,
        lastTime: Date.now(),
        velocity: 0,
        fromHandle,
      };
    }

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      const dy = touch.clientY - drag.current.startY;
      const movingDown = dy > 0;

      // If not already dragging, check if we should start
      if (!drag.current.active) {
        if (Math.abs(dy) < 5) return; // dead zone
        if (!canDragSheet(drag.current.fromHandle, movingDown)) return;
        // Start dragging
        drag.current.active = true;
        drag.current.startTop = getTopVh();
        drag.current.startY = touch.clientY;
        if (sheetRef.current) sheetRef.current.style.transition = "none";
      }

      if (!drag.current.active || !sheetRef.current) return;

      // Prevent content scroll while dragging sheet
      e.preventDefault();

      const dyVh = ((touch.clientY - drag.current.startY) / window.innerHeight) * 100;
      const newTop = Math.max(SNAP.full - 3, Math.min(SNAP.collapsed + 2, drag.current.startTop + dyVh));
      sheetRef.current.style.top = `${newTop}vh`;

      // Velocity
      const now = Date.now();
      const dt = now - drag.current.lastTime;
      if (dt > 0) {
        drag.current.velocity = (touch.clientY - drag.current.lastY) / dt * 16; // normalize to ~60fps
      }
      drag.current.lastY = touch.clientY;
      drag.current.lastTime = now;
    }

    function onTouchEnd() {
      if (!drag.current.active) return;
      drag.current.active = false;

      const topVh = getTopVh();
      const v = drag.current.velocity;

      // Velocity-based snap
      if (v > 4) { snapTo("collapsed"); return; }
      if (v < -4) { snapTo("full"); return; }

      // Distance-based: snap to nearest
      const dists = [
        { snap: "collapsed" as const, d: Math.abs(topVh - SNAP.collapsed) },
        { snap: "half" as const, d: Math.abs(topVh - SNAP.half) },
        { snap: "full" as const, d: Math.abs(topVh - SNAP.full) },
      ];
      dists.sort((a, b) => a.d - b.d);
      snapTo(dists[0].snap);
    }

    // Use non-passive for touchmove so we can preventDefault
    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
    };
  }, [getTopVh, canDragSheet, snapTo]);

  // Sync from store
  useEffect(() => {
    if (drag.current.active) return;
    animateTo(SNAP[sheetSnap]);
  }, [sheetSnap, animateTo]);

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
          top: `${SNAP[sheetSnap]}vh`,
          bottom: "56px",
          willChange: "top",
        }}
      >
        {/* Handle — always draggable */}
        <div className="flex flex-col items-center shrink-0 select-none">
          <div className="pt-3 pb-1">
            <div className="w-9 h-[5px] rounded-full bg-muted-foreground/25" />
          </div>

          {isCollapsed && peekContent && (
            <div className="w-full px-4 pb-2">{peekContent}</div>
          )}
        </div>

        {/* Content — scroll inside, pull-down-at-top triggers sheet drag */}
        <div
          ref={contentRef}
          className={`flex-1 overflow-y-auto overscroll-none ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"} transition-opacity duration-150`}
        >
          {children}
        </div>
      </div>
    </>
  );
}
