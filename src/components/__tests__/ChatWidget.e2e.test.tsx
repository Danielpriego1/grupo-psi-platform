/**
 * E2E-style tests for <ChatWidget /> at mobile and tablet viewports.
 *
 * Coverage:
 *  - Textarea auto-grows as the content's scrollHeight increases.
 *  - Pressing Enter submits the message (textarea clears, request fires).
 *  - Pressing Shift+Enter inserts a newline and does NOT submit.
 *
 * Note: This is run in jsdom via Vitest. jsdom does not perform real layout,
 * so we mock `scrollHeight` on HTMLTextAreaElement to simulate growth.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

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

import { ChatWidget } from "@/components/ChatWidget";

type Viewport = { width: number; height: number };

const MOBILE: Viewport = { width: 390, height: 844 };   // iPhone 12/13/14
const TABLET: Viewport = { width: 820, height: 1180 };  // iPad Air

function setViewport({ width, height }: Viewport) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

/**
 * Make textarea.scrollHeight reflect its value length so the auto-resize
 * logic in ChatWidget produces deterministic, observable growth.
 */
function installScrollHeightMock() {
  Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
    configurable: true,
    get() {
      const value: string = (this as HTMLTextAreaElement).value || "";
      const lines = value.split("\n").length;
      // 24px per line + ~32px vertical padding — enough to exceed min-h:56 quickly.
      return 32 + lines * 24;
    },
  });
}

function openChat() {
  // The trigger is the only top-level <button> at first render.
  const triggers = document.querySelectorAll("button");
  fireEvent.click(triggers[0]);
}

function getTextarea() {
  return screen.getByPlaceholderText(/escribe tu mensaje/i) as HTMLTextAreaElement;
}

beforeEach(() => {
  invokeMock.mockReset();
  invokeMock.mockResolvedValue({ data: { reply: "ok" }, error: null });
  installScrollHeightMock();
});

afterEach(() => {
  cleanup();
  // Restore default
  // @ts-expect-error: cleanup the override
  delete HTMLTextAreaElement.prototype.scrollHeight;
});

describe.each([
  ["mobile", MOBILE],
  ["tablet", TABLET],
] as const)("ChatWidget @ %s viewport", (_label, viewport) => {
  beforeEach(() => setViewport(viewport));

  it("auto-grows the textarea as more lines are typed", async () => {
    render(<ChatWidget />);
    openChat();

    const textarea = getTextarea();
    const initialHeight = textarea.style.height; // "" or "56px"

    fireEvent.change(textarea, {
      target: { value: "linea 1\nlinea 2\nlinea 3\nlinea 4" },
    });

    await waitFor(() => {
      expect(textarea.style.height).not.toBe(initialHeight);
    });

    const grown = parseInt(textarea.style.height || "0", 10);
    expect(grown).toBeGreaterThan(56);
    // Capped at 160px per component logic
    expect(grown).toBeLessThanOrEqual(160);
  });

  it("sends the message when pressing Enter (no Shift)", async () => {
    render(<ChatWidget />);
    openChat();

    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: "hola sora" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledTimes(1);
    });
    expect(invokeMock).toHaveBeenCalledWith(
      "sora-chat",
      expect.objectContaining({
        body: expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "user", content: "hola sora" }),
          ]),
        }),
      })
    );
    // Textarea should clear after send
    expect(textarea.value).toBe("");
  });

  it("inserts a newline with Shift+Enter and does NOT submit", async () => {
    render(<ChatWidget />);
    openChat();

    const textarea = getTextarea();
    fireEvent.change(textarea, { target: { value: "linea 1" } });

    // Shift+Enter should be passed through (no preventDefault in component).
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: true });
    // jsdom doesn't actually insert the newline from the keydown — simulate
    // the resulting input the browser would produce.
    fireEvent.change(textarea, { target: { value: "linea 1\nlinea 2" } });

    // No submission triggered
    expect(invokeMock).not.toHaveBeenCalled();
    expect(textarea.value).toBe("linea 1\nlinea 2");
  });
});
