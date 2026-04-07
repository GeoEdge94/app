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
  const handleRef = useRef<HTMLDivElement>(null);
  const { sheetSnap, setSheetSnap } = useMapStore();

  // Drag state
  const state = useRef({
    dragging: false,
    decided: false,
    startY: 0,
    startTop: 0,
    prevY: 0,
    prevT: 0,
    vel: 0,
  });

  const getTopVh = useCallback(() => {
    if (!sheetRef.current) return SNAP.half;
    return (sheetRef.current.getBoundingClientRect().top / window.innerHeight) * 100;
  }, []);

  const animateTo = useCallback((vh: number) => {
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = "top 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
    sheetRef.current.style.top = `${vh}vh`;
  }, []);

  const snapTo = useCallback((s: "collapsed" | "half" | "full") => {
    setSheetSnap(s);
    animateTo(SNAP[s]);
  }, [setSheetSnap, animateTo]);

  const moveSheet = useCallback((y: number) => {
    const s = state.current;
    const dyVh = ((y - s.startY) / window.innerHeight) * 100;
    const top = Math.max(SNAP.full - 2, Math.min(SNAP.collapsed + 1, s.startTop + dyVh));
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
      sheetRef.current.style.top = `${top}vh`;
    }
    const now = Date.now();
    const dt = now - s.prevT;
    if (dt > 0) s.vel = ((y - s.prevY) / dt) * 16;
    s.prevY = y;
    s.prevT = now;
  }, []);

  const endDrag = useCallback(() => {
    const s = state.current;
    if (!s.dragging) return;
    s.dragging = false;
    s.decided = false;
    const top = getTopVh();
    const v = s.vel;
    if (v > 3) { snapTo("collapsed"); return; }
    if (v < -3) { snapTo("full"); return; }
    const dists = (Object.keys(SNAP) as Array<keyof typeof SNAP>).map((k) => ({ snap: k, d: Math.abs(top - SNAP[k]) }));
    dists.sort((a, b) => a.d - b.d);
    snapTo(dists[0].snap);
  }, [getTopVh, snapTo]);

  // ─── HANDLE touch (always drags) ───
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    function onStart(e: TouchEvent) {
      const y = e.touches[0].clientY;
      state.current = { dragging: true, decided: true, startY: y, startTop: getTopVh(), prevY: y, prevT: Date.now(), vel: 0 };
    }
    function onMove(e: TouchEvent) {
      if (!state.current.dragging) return;
      e.preventDefault();
      moveSheet(e.touches[0].clientY);
    }
    function onEnd() { endDrag(); }

    handle.addEventListener("touchstart", onStart, { passive: true });
    handle.addEventListener("touchmove", onMove, { passive: false });
    handle.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      handle.removeEventListener("touchstart", onStart);
      handle.removeEventListener("touchmove", onMove);
      handle.removeEventListener("touchend", onEnd);
    };
  }, [getTopVh, moveSheet, endDrag]);

  // ─── CONTENT touch (drag only when scrolled to top + pulling down) ───
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    function onStart(e: TouchEvent) {
      const y = e.touches[0].clientY;
      state.current = { dragging: false, decided: false, startY: y, startTop: getTopVh(), prevY: y, prevT: Date.now(), vel: 0 };
    }

    function onMove(e: TouchEvent) {
      const s = state.current;
      const y = e.touches[0].clientY;
      const dy = y - s.startY;

      if (!s.decided) {
        if (Math.abs(dy) < 8) return;
        s.decided = true;
        const atTop = content!.scrollTop <= 0;
        const pullingDown = dy > 0;
        if (atTop && pullingDown) {
          s.dragging = true;
          s.startY = y;
          s.startTop = getTopVh();
        }
      }

      if (!s.dragging) return;
      e.preventDefault();
      moveSheet(y);
    }

    function onEnd() { endDrag(); }

    content.addEventListener("touchstart", onStart, { passive: true });
    content.addEventListener("touchmove", onMove, { passive: false });
    content.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      content.removeEventListener("touchstart", onStart);
      content.removeEventListener("touchmove", onMove);
      content.removeEventListener("touchend", onEnd);
    };
  }, [getTopVh, moveSheet, endDrag]);

  // Sync from store
  useEffect(() => {
    if (state.current.dragging) return;
    animateTo(SNAP[sheetSnap]);
  }, [sheetSnap, animateTo]);

  const isCollapsed = sheetSnap === "collapsed";

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex md:w-[380px] md:relative md:h-full bg-background border-l border-border z-30 flex-col">
        {children}
      </aside>

      {/* Mobile */}
      <div
        ref={sheetRef}
        className="md:hidden fixed left-0 right-0 z-30 flex flex-col bg-background rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)]"
        style={{ top: `${SNAP[sheetSnap]}vh`, bottom: "56px" }}
      >
        {/* Handle — toujours draggable */}
        <div ref={handleRef} className="flex flex-col items-center shrink-0 select-none cursor-grab active:cursor-grabbing">
          <div className="w-full flex justify-center pt-3 pb-2">
            <div className="w-10 h-[5px] rounded-full bg-muted-foreground/25" />
          </div>
          {isCollapsed && peekContent && (
            <div className="w-full px-4 pb-2">{peekContent}</div>
          )}
        </div>

        {/* Content — scroll normalement, drag sheet quand en haut + pull down */}
        <div
          ref={contentRef}
          className={`flex-1 overflow-y-auto ${isCollapsed ? "invisible" : "visible"}`}
          style={{ overscrollBehavior: "none" }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
