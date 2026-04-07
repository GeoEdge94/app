"use client";

import { useRef, useCallback, useEffect, type ReactNode } from "react";
import { useMapStore } from "@/stores/useMapStore";

const SNAP = { collapsed: 92, half: 45, full: 12 } as const;
const HANDLE_HEIGHT = 44;
const DEAD_ZONE = 6;

interface BottomSheetProps {
  children: ReactNode;
  peekContent?: ReactNode;
}

export function BottomSheet({ children, peekContent }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startTop = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const decided = useRef(false); // have we decided scroll vs drag?
  const { sheetSnap, setSheetSnap } = useMapStore();

  const getTopVh = useCallback(() => {
    if (!sheetRef.current) return SNAP.half;
    return (sheetRef.current.getBoundingClientRect().top / window.innerHeight) * 100;
  }, []);

  const animateTo = useCallback((vh: number) => {
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = "top 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
    sheetRef.current.style.top = `${vh}vh`;
  }, []);

  const snapTo = useCallback((snap: "collapsed" | "half" | "full") => {
    setSheetSnap(snap);
    animateTo(SNAP[snap]);
  }, [setSheetSnap, animateTo]);

  useEffect(() => {
    const sheet = sheetRef.current;
    const content = contentRef.current;
    if (!sheet || !content) return;

    function handleStart(e: TouchEvent) {
      const y = e.touches[0].clientY;
      startY.current = y;
      startTop.current = getTopVh();
      lastY.current = y;
      lastTime.current = Date.now();
      velocity.current = 0;
      isDragging.current = false;
      decided.current = false;
    }

    function handleMove(e: TouchEvent) {
      const y = e.touches[0].clientY;
      const dy = y - startY.current;
      const absDy = Math.abs(dy);

      // Wait for dead zone before deciding
      if (!decided.current) {
        if (absDy < DEAD_ZONE) return;
        decided.current = true;

        // Check: should we drag the sheet or let content scroll?
        const isOnHandle = (() => {
          const sheetRect = sheet!.getBoundingClientRect();
          return (startY.current - sheetRect.top) < HANDLE_HEIGHT;
        })();

        const contentAtTop = content!.scrollTop <= 1;
        const pullingDown = dy > 0;

        // Drag sheet if: on handle, OR content at top AND pulling down
        if (isOnHandle || (contentAtTop && pullingDown)) {
          isDragging.current = true;
          // Reset start to current position for smooth start
          startY.current = y;
          startTop.current = getTopVh();
          sheet!.style.transition = "none";
        } else {
          isDragging.current = false;
          return; // let browser handle scroll
        }
      }

      if (!isDragging.current) return;

      // Prevent scroll while dragging sheet
      e.preventDefault();
      e.stopPropagation();

      const dyVh = ((y - startY.current) / window.innerHeight) * 100;
      const newTop = Math.max(SNAP.full - 2, Math.min(SNAP.collapsed + 1, startTop.current + dyVh));
      sheet!.style.top = `${newTop}vh`;

      // Track velocity
      const now = Date.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        velocity.current = ((y - lastY.current) / dt) * 16;
      }
      lastY.current = y;
      lastTime.current = now;
    }

    function handleEnd() {
      if (!isDragging.current) return;
      isDragging.current = false;
      decided.current = false;

      const topVh = getTopVh();
      const v = velocity.current;

      // Flick
      if (v > 3) { snapTo("collapsed"); return; }
      if (v < -3) { snapTo("full"); return; }

      // Nearest snap
      const snaps = [
        { snap: "collapsed" as const, d: Math.abs(topVh - SNAP.collapsed) },
        { snap: "half" as const, d: Math.abs(topVh - SNAP.half) },
        { snap: "full" as const, d: Math.abs(topVh - SNAP.full) },
      ];
      snaps.sort((a, b) => a.d - b.d);
      snapTo(snaps[0].snap);
    }

    // Attach to BOTH sheet (for handle) and content (for scroll-at-top detection)
    sheet.addEventListener("touchstart", handleStart, { passive: true });
    sheet.addEventListener("touchmove", handleMove, { passive: false });
    sheet.addEventListener("touchend", handleEnd, { passive: true });

    return () => {
      sheet.removeEventListener("touchstart", handleStart);
      sheet.removeEventListener("touchmove", handleMove);
      sheet.removeEventListener("touchend", handleEnd);
    };
  }, [getTopVh, snapTo]);

  // Sync from store
  useEffect(() => {
    if (isDragging.current) return;
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
        {/* Handle area */}
        <div className="flex flex-col items-center shrink-0 select-none">
          <div className="w-full flex justify-center pt-3 pb-1">
            <div className="w-9 h-[5px] rounded-full bg-muted-foreground/25" />
          </div>
          {isCollapsed && peekContent && (
            <div className="w-full px-4 pb-2">{peekContent}</div>
          )}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className={`flex-1 overflow-y-auto ${isCollapsed ? "invisible" : "visible"}`}
          style={{ overscrollBehavior: "none", WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
