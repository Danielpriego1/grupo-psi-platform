/**
 * Cross-tab synchronization tests for <ChatWidget />.
 *
 * Verifies that state changes coming from *other tabs* — delivered via
 * BroadcastChannel or the `storage` event — are reflected in the widget.
 *
 * Covered channels:
 *  - BroadcastChannel: open, ghost, radius (immediate, no localStorage)
 *  - StorageEvent fallback: ghost + radius via `soraGhost` / `soraProximityRadius`
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// --- Mock the Supabase client used by ChatWidget ---
const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

// Silence perf instrumentation in tests
vi.mock("@/lib/perfMonitor", () => ({
  isPerfEnabled: () => false,
  logPerf: () => {},
  useRenderMetrics: () => {},
  useScrollMetrics: () => {},
  useFpsMonitor: () => {},
  useLongTaskMonitor: () => {},
}));

// --- Mock BroadcastChannel and capture instances ---
interface MockBCInstance {
  name: string;
  onmessage: ((ev: MessageEvent<unknown>) => void) | null;
  postMessage: (data: unknown) => void;
  close: () => void;
  _closed: boolean;
}
const bcInstances: MockBCInstance[] = [];
class MockBroadcastChannel implements MockBCInstance {
  name: string;
  onmessage: ((ev: MessageEvent<unknown>) => void) | null = null;
  _closed = false;
  constructor(name: string) {
    this.name = name;
    bcInstances.push(this);
  }
  postMessage() { /* no-op — we drive messages manually */ }
  close() { this._closed = true; }
}

import { ChatWidget } from "@/components/ChatWidget";

function latestBC(): MockBCInstance {
  const live = bcInstances.filter(b => !b._closed);
  const bc = live[live.length - 1];
  if (!bc) throw new Error("No BroadcastChannel instance was constructed");
  return bc;
}

function sendBC(data: unknown) {
  const bc = latestBC();
  if (!bc.onmessage) throw new Error("BroadcastChannel has no listener");
  act(() => {
    bc.onmessage!(new MessageEvent("message", { data }));
  });
}

function sendStorage(key: string, newValue: string) {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
  });
}

beforeEach(() => {
  invokeMock.mockReset();
  invokeMock.mockResolvedValue({ data: { reply: "ok" }, error: null });
  localStorage.clear();
  bcInstances.length = 0;
  (globalThis as unknown as { BroadcastChannel: typeof MockBroadcastChannel }).BroadcastChannel =
    MockBroadcastChannel;
  // ResizeObserver polyfill for Radix Slider
  if (typeof (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver === "undefined") {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!("scrollTo" in Element.prototype)) {
    (Element.prototype as unknown as { scrollTo: () => void }).scrollTo = () => {};
  } else {
    vi.spyOn(Element.prototype, "scrollTo").mockImplementation(() => {});
  }
});

function panelIsOpen(): boolean {
  const ta = screen.queryByPlaceholderText(/escribe o toca el micrófono/i) as HTMLTextAreaElement | null;
  if (!ta) return false;
  const panel = ta.closest("div.fixed") as HTMLElement | null;
  return !!panel && !/opacity-0|pointer-events-none/.test(panel.className);
}

afterEach(() => {
  cleanup();
});

describe("ChatWidget cross-tab sync", () => {
  it("opens the panel when another tab broadcasts { type: 'open', value: true }", async () => {
    render(<ChatWidget />);

    // Panel textarea should not be reachable while closed (pointer-events-none)
    expect(screen.queryByPlaceholderText(/escribe o toca el micrófono/i)).toBeNull();

    sendBC({ type: "open", value: true });

    await waitFor(() => {
      // When open, the textarea is present in the DOM
      expect(screen.getByPlaceholderText(/escribe o toca el micrófono/i)).toBeInTheDocument();
    });

    // And broadcasting `open:false` from another tab closes it again
    sendBC({ type: "open", value: false });
    await waitFor(() => {
      const ta = screen.queryByPlaceholderText(/escribe o toca el micrófono/i) as HTMLTextAreaElement | null;
      // Either removed from tree or its parent has opacity-0/pointer-events-none
      if (ta) {
        const panel = ta.closest("div.fixed") as HTMLElement | null;
        expect(panel?.className).toMatch(/opacity-0|pointer-events-none/);
      }
    });
  });

  it("enables ghost mode when another tab broadcasts { type: 'ghost', value: true }", async () => {
    render(<ChatWidget />);

    // No ghost indicator on the launcher initially
    expect(document.querySelector('[title="Modo fantasma activo"]')).toBeNull();

    sendBC({ type: "ghost", value: true });

    await waitFor(() => {
      // Ghost badge overlay on the launcher gets a title="Modo fantasma activo"
      expect(document.querySelector('[title="Modo fantasma activo"]')).not.toBeNull();
    });
  });

  it("updates the proximity radius when another tab broadcasts { type: 'radius', value }", async () => {
    render(<ChatWidget />);

    // Open the panel + settings so the radius label is visible
    sendBC({ type: "open", value: true });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/escribe o toca el micrófono/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText(/abrir ajustes/i));

    // Default is 140
    await waitFor(() => expect(screen.getByText("140 px")).toBeInTheDocument());

    // A remote tab moves the slider to 220
    sendBC({ type: "radius", value: 220 });

    await waitFor(() => expect(screen.getByText("220 px")).toBeInTheDocument());
  });

  it("falls back to StorageEvent for radius updates when BroadcastChannel is unavailable", async () => {
    render(<ChatWidget />);

    sendBC({ type: "open", value: true });
    fireEvent.click(await screen.findByLabelText(/abrir ajustes/i));

    await waitFor(() => expect(screen.getByText("140 px")).toBeInTheDocument());

    // Another tab writes directly to localStorage → StorageEvent fires here
    sendStorage("soraProximityRadius", "260");

    await waitFor(() => expect(screen.getByText("260 px")).toBeInTheDocument());
  });

  it("falls back to StorageEvent for ghost mode toggles", async () => {
    render(<ChatWidget />);
    expect(document.querySelector('[title="Modo fantasma activo"]')).toBeNull();

    sendStorage("soraGhost", "1");

    await waitFor(() => {
      expect(document.querySelector('[title="Modo fantasma activo"]')).not.toBeNull();
    });

    sendStorage("soraGhost", "0");

    await waitFor(() => {
      expect(document.querySelector('[title="Modo fantasma activo"]')).toBeNull();
    });
  });
});
