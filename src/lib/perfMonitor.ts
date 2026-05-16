/**
 * Lightweight performance monitor for the chat widget.
 * Active in dev, or in prod when `localStorage.chatPerf = "1"`.
 *
 * Logs:
 *  - Render count + duration (ms) per component
 *  - Scroll event timing (frame-to-frame ms) on a target element
 *  - Rolling FPS via requestAnimationFrame
 *  - Long task warnings (>50ms) via PerformanceObserver
 */

export function isPerfEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.DEV) return true;
  try {
    return window.localStorage.getItem("chatPerf") === "1";
  } catch {
    return false;
  }
}

import { useEffect, useRef } from "react";

const LOG_PREFIX = "%c[chat-perf]";
const LOG_STYLE = "color:#ea580c;font-weight:bold";

export function logPerf(...args: unknown[]) {
  if (!isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.log(LOG_PREFIX, LOG_STYLE, ...args);
}

/** Measures render count + duration for the calling component. */
export function useRenderMetrics(label: string, deps: { messageCount: number }) {
  const renderCountRef = useRef(0);
  const lastRenderStartRef = useRef(0);

  if (isPerfEnabled()) {
    lastRenderStartRef.current = performance.now();
    renderCountRef.current += 1;
  }

  useEffect(() => {
    if (!isPerfEnabled()) return;
    const duration = performance.now() - lastRenderStartRef.current;
    logPerf(
      `${label} render #${renderCountRef.current} → ${duration.toFixed(1)}ms (messages: ${deps.messageCount})`
    );
    if (duration > 16) {
      logPerf(`⚠ slow render: ${duration.toFixed(1)}ms exceeds one frame budget`);
    }
  });
}

/** Tracks scroll-event cadence to surface jank during streaming/typing. */
export function useScrollMetrics(ref: React.RefObject<HTMLElement>, label: string) {
  useEffect(() => {
    if (!isPerfEnabled() || !ref.current) return;
    const el = ref.current;
    let lastTs = 0;
    let worst = 0;
    let count = 0;
    let reportTimer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      const now = performance.now();
      if (lastTs) {
        const delta = now - lastTs;
        if (delta > worst) worst = delta;
        count += 1;
      }
      lastTs = now;
      if (reportTimer) clearTimeout(reportTimer);
      reportTimer = setTimeout(() => {
        if (count > 0) {
          logPerf(`${label} scroll burst: ${count} events, worst frame gap ${worst.toFixed(1)}ms`);
        }
        worst = 0;
        count = 0;
        lastTs = 0;
      }, 250);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (reportTimer) clearTimeout(reportTimer);
    };
  }, [ref, label]);
}

/** Rolling FPS sampler — logs once per second when active. */
export function useFpsMonitor(active: boolean, label: string) {
  useEffect(() => {
    if (!isPerfEnabled() || !active) return;
    let frames = 0;
    let last = performance.now();
    let rafId = 0;
    let stopped = false;

    const tick = () => {
      frames += 1;
      const now = performance.now();
      if (now - last >= 1000) {
        const fps = (frames * 1000) / (now - last);
        logPerf(`${label} FPS: ${fps.toFixed(0)}${fps < 50 ? " ⚠" : ""}`);
        frames = 0;
        last = now;
      }
      if (!stopped) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
    };
  }, [active, label]);
}

/** Logs long tasks (>50ms) reported by the browser. */
export function useLongTaskMonitor(label: string) {
  useEffect(() => {
    if (!isPerfEnabled()) return;
    if (typeof PerformanceObserver === "undefined") return;
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          logPerf(`${label} long task: ${entry.duration.toFixed(1)}ms`);
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      // longtask not supported in this browser
    }
    return () => observer?.disconnect();
  }, [label]);
}
