/**
 * Accessibility tests for the proximity-radius circle in <ChatWidget />.
 *
 * Verifies:
 *  - The circle is focusable via Tab (tabIndex=0, role=slider).
 *  - ARIA attributes (valuemin/max/now/valuetext + aria-label) update as radius changes.
 *  - Arrow keys adjust the radius and the aria-live region announces the new value.
 *  - Radius persists to localStorage (soraProximityRadius).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor, act } from "@testing-library/react";

const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

vi.mock("@/lib/perfMonitor", () => ({
  isPerfEnabled: () => false,
  logPerf: () => {},
  useRenderMetrics: () => {},
  useScrollMetrics: () => {},
  useFpsMonitor: () => {},
  useLongTaskMonitor: () => {},
}));

class MockBroadcastChannel {
  name: string;
  onmessage: ((ev: MessageEvent<unknown>) => void) | null = null;
  constructor(name: string) { this.name = name; }
  postMessage() {}
  close() {}
}

import { ChatWidget } from "@/components/ChatWidget";

beforeEach(() => {
  invokeMock.mockReset();
  invokeMock.mockResolvedValue({ data: { reply: "ok" }, error: null });
  localStorage.clear();
  // Enable ghost mode by default so the circle renders
  localStorage.setItem("soraGhost", "1");
  (globalThis as unknown as { BroadcastChannel: typeof MockBroadcastChannel }).BroadcastChannel =
    MockBroadcastChannel;
  if (typeof (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver === "undefined") {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {} unobserve() {} disconnect() {}
    };
  }
  if (!("scrollTo" in Element.prototype)) {
    (Element.prototype as unknown as { scrollTo: () => void }).scrollTo = () => {};
  }
});

afterEach(() => cleanup());

function getRadiusCircle(): HTMLElement {
  const el = document.querySelector('[role="slider"][aria-label="Radio de proximidad de Sora"]');
  if (!el) throw new Error("Radius circle not found");
  return el as HTMLElement;
}

describe("ChatWidget · proximity-radius accessibility", () => {
  it("renders as a focusable slider with full ARIA metadata", () => {
    render(<ChatWidget />);
    const circle = getRadiusCircle();
    expect(circle.getAttribute("tabindex")).toBe("0");
    expect(circle.getAttribute("role")).toBe("slider");
    expect(circle.getAttribute("aria-valuemin")).toBe("60");
    expect(circle.getAttribute("aria-valuemax")).toBe("320");
    expect(circle.getAttribute("aria-valuenow")).toBe("140");
    expect(circle.getAttribute("aria-valuetext")).toBe("140 píxeles");
    expect(circle.getAttribute("aria-labelledby")).toBe("sora-radius-label");
    expect(circle.getAttribute("aria-describedby")).toBe("sora-radius-desc");

    // Focusable via programmatic focus (equivalent to Tab landing on it)
    circle.focus();
    expect(document.activeElement).toBe(circle);
  });

  it("increases radius with ArrowUp and updates aria-valuenow + live region", async () => {
    render(<ChatWidget />);
    const circle = getRadiusCircle();
    circle.focus();

    fireEvent.keyDown(circle, { key: "ArrowUp" });

    await waitFor(() => {
      expect(getRadiusCircle().getAttribute("aria-valuenow")).toBe("150");
    });
    expect(getRadiusCircle().getAttribute("aria-valuetext")).toBe("150 píxeles");

    // Debounced (600ms) announcement in the live region
    await act(async () => {
      await new Promise((r) => setTimeout(r, 700));
    });
    const live = document.querySelector('[role="status"][aria-live="polite"]:last-of-type');
    expect(live?.textContent || "").toMatch(/150 píxeles/);
  });

  it("decreases radius with ArrowDown and clamps at the minimum", async () => {
    render(<ChatWidget />);
    const circle = getRadiusCircle();
    circle.focus();

    // 140 → 60 requires 8 steps of 10; press 12 to test clamping
    for (let i = 0; i < 12; i++) {
      fireEvent.keyDown(circle, { key: "ArrowDown" });
    }
    await waitFor(() => {
      expect(getRadiusCircle().getAttribute("aria-valuenow")).toBe("60");
    });
  });

  it("jumps to min / max with Home and End", async () => {
    render(<ChatWidget />);
    const circle = getRadiusCircle();
    circle.focus();

    fireEvent.keyDown(circle, { key: "End" });
    await waitFor(() => expect(getRadiusCircle().getAttribute("aria-valuenow")).toBe("320"));

    fireEvent.keyDown(circle, { key: "Home" });
    await waitFor(() => expect(getRadiusCircle().getAttribute("aria-valuenow")).toBe("60"));
  });

  it("persists the selected radius to localStorage", async () => {
    render(<ChatWidget />);
    const circle = getRadiusCircle();
    circle.focus();
    fireEvent.keyDown(circle, { key: "ArrowUp" });
    fireEvent.keyDown(circle, { key: "ArrowUp" });

    await waitFor(() => {
      expect(localStorage.getItem("soraProximityRadius")).toBe("160");
    });
  });
});
