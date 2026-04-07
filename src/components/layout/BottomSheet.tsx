"use client";

import { useRef, useCallback, useEffect, type ReactNode } from "react";
import { useMapStore } from "@/stores/useMapStore";

const SNAP_POINTS = {
  collapsed: 56,
  half: 55,    // vh
  full: 85,    // vh
};

interface BottomSheetProps {
  children: ReactNode;
  peekContent?: ReactNode;
}

export function BottomSheet({ children, peekContent }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startY: 0, startH: 0 });
  const { sheetSnap, setSheetSnap } = useMapStore();

  // Current height in px
  const getSheetPx = useCallback(() => {
    if (!sheetRef.current) return 0;
    return sheetRef.current.getBoundingClientRect().height;
  }, []);

  // Convert snap to px
  const snapToPx = useCallback((snap: "collapsed" | "half" | "full") => {
    if (snap === "collapsed") return SNAP_POINTS.collapsed;
    const vh = window.innerHeight;
    return snap === "full" ? vh * SNAP_POINTS.full / 100 : vh * SNAP_POINTS.half / 100;
  }, []);

  // Touch start
  const onTouchStart = useCallback((e: TouchEvent) => {
    dragState.current = {
      dragging: true,
      startY: e.touches[0].clientY,
      startH: getSheetPx(),
    };
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }, [getSheetPx]);

  // Touch move
  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState.current.dragging || !sheetRef.current) return;
    const dy = dragState.current.startY - e.touches[0].clientY;
    const newH = Math.max(SNAP_POINTS.collapsed, Math.min(dragState.current.startH + dy, window.innerHeight * 0.9));
    sheetRef.current.style.height = `${newH}px`;
  }, []);

  // Touch end — snap to nearest point
  const onTouchEnd = useCallback(() => {
    if (!dragState.current.dragging || !sheetRef.current) return;
    dragState.current.dragging = false;
    sheetRef.current.style.transition = "height 0.3s cubic-bezier(0.32, 0.72, 0, 1)";

    const h = getSheetPx();
    const vh = window.innerHeight;
    const thresholds = [
      { snap: "collapsed" as const, px: SNAP_POINTS.collapsed },
      { snap: "half" as const, px: vh * SNAP_POINTS.half / 100 },
      { snap: "full" as const, px: vh * SNAP_POINTS.full / 100 },
    ];

    // Find closest snap
    let closest = thresholds[0];
    let minDist = Infinity;
    for (const t of thresholds) {
      const dist = Math.abs(h - t.px);
      if (dist < minDist) { minDist = dist; closest = t; }
    }

    // Velocity-based: if moving fast down, collapse
    setSheetSnap(closest.snap);
    sheetRef.current.style.height = closest.snap === "collapsed"
      ? `${SNAP_POINTS.collapsed}px`
      : `${closest.snap === "full" ? SNAP_POINTS.full : SNAP_POINTS.half}dvh`;
  }, [getSheetPx, setSheetSnap]);

  // Attach touch events to handle
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    handle.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      handle.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  // Sync height when snap changes from outside (e.g., zone select)
  useEffect(() => {
    if (!sheetRef.current || dragState.current.dragging) return;
    sheetRef.current.style.transition = "height 0.3s cubic-bezier(0.32, 0.72, 0, 1)";
    if (sheetSnap === "collapsed") {
      sheetRef.current.style.height = `${SNAP_POINTS.collapsed}px`;
    } else if (sheetSnap === "half") {
      sheetRef.current.style.height = `${SNAP_POINTS.half}dvh`;
    } else {
      sheetRef.current.style.height = `${SNAP_POINTS.full}dvh`;
    }
  }, [sheetSnap]);

  return (
    <aside
      ref={sheetRef}
      className="
        bg-background border-l border-border z-30 flex flex-col
        md:w-[380px] md:relative md:!h-full
        fixed left-0 right-0 bottom-14 md:bottom-0
        md:rounded-none rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] md:shadow-none
        will-change-[height]
      "
      style={{ height: sheetSnap === "collapsed" ? `${SNAP_POINTS.collapsed}px` : `${SNAP_POINTS.half}dvh` }}
    >
      {/* Drag handle — mobile only */}
      <div
        ref={handleRef}
        className="md:hidden flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing shrink-0 touch-none select-none"
        onClick={() => {
          // Tap to toggle (only fires if not dragging)
          if (sheetSnap === "collapsed") setSheetSnap("half");
          else if (sheetSnap === "half") setSheetSnap("full");
          else setSheetSnap("collapsed");
        }}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Peek content when collapsed */}
      {sheetSnap === "collapsed" && peekContent && (
        <div className="md:hidden px-4 pb-1">{peekContent}</div>
      )}

      {/* Main content */}
      <div className={`flex-1 overflow-hidden ${sheetSnap === "collapsed" ? "hidden md:flex" : "flex"} flex-col`}>
        {children}
      </div>
    </aside>
  );
}
