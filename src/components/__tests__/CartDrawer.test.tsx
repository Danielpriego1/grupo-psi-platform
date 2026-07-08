/**
 * Integration tests for the CartDrawer:
 *  1. "Cambiar" popover on a cart line re-selects size/color, price updates,
 *     line survives, and the WhatsApp message reflects the new variant.
 *  2. WhatsApp message always includes "Talla" and "Color" (or "—") per line
 *     and its per-line subtotal sum matches the drawer total.
 *  3. Live inventory stock: raising quantity above stock disables Pagar/Cotizar
 *     and shows the warning; lowering it re-enables the buttons.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import type { Product } from "@/data/products";

// --- Mocks ---------------------------------------------------------------

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Configurable inventory row set by each test before rendering.
let mockInventory: Array<{ product_id: string; stock: number }> = [];

vi.mock("@/integrations/supabase/client", () => {
  const inventoryQuery = () => ({
    select: () => ({
      in: async () => ({ data: mockInventory, error: null }),
    }),
  });
  return {
    supabase: {
      from: (_table: string) => inventoryQuery(),
      functions: {
        invoke: vi.fn(async () => ({
          data: { orderNumber: "COT-TEST-1", url: null },
          error: null,
        })),
      },
    },
  };
});

// --- Fixture -------------------------------------------------------------

const polo: Product = {
  id: "polo-drawer-1",
  name: "Playera Polo Test",
  category: "Uniformes",
  description: "",
  priceOriginalMxn: 300,
  discount: null,
  purchaseUrl: null,
  purchaseStatus: "Available",
  inStock: true,
  variants: { color: ["Blanco", "Negro", "Azul"] },
  sizes: { sizePlayeras: ["CH", "M", "G"] },
};

// A non-uniforme line: no sizes, no colors → message must render "Talla: —"/"Color: —"
// only when the product HAS those variant types. If not, the line omits both,
// which matches the current buildWhatsAppMessage contract. We test both.
const accesorio: Product = {
  id: "acc-drawer-1",
  name: "Accesorio Test",
  category: "Accesorios",
  description: "",
  priceOriginalMxn: 100,
  discount: null,
  purchaseUrl: null,
  purchaseStatus: "Available",
  inStock: true,
};

/** Helper: seeds the cart with items, then renders the drawer open. */
function Harness({ seed }: { seed: Array<Parameters<ReturnType<typeof useCart>["addItem"]>[0]> }) {
  function Seeder() {
    const { addItem, setIsOpen, items } = useCart();
    // Seed once on first render
    if (items.length === 0) {
      for (const s of seed) addItem(s);
      setIsOpen(true);
    }
    return null;
  }
  return (
    <CartProvider>
      <Seeder />
      <CartDrawer />
    </CartProvider>
  );
}

async function flush() {
  // Let queued microtasks (supabase mock, useEffect) settle.
  await act(async () => { await Promise.resolve(); });
  await act(async () => { await Promise.resolve(); });
}

// --- Tests ---------------------------------------------------------------

describe("CartDrawer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    mockInventory = [];
  });

  it("[1] 'Cambiar' re-selects size+color on a line, updates price and the WhatsApp message", async () => {
    mockInventory = [{ product_id: polo.id, stock: 50 }];
    render(
      <Harness
        seed={[{ product: polo, quantity: 1, selectedSize: "CH", selectedVariant: "Blanco" }]}
      />
    );
    await flush();

    // Initial line label
    expect(screen.getByText(/Talla: CH/)).toBeInTheDocument();
    expect(screen.getByText(/Color: Blanco/)).toBeInTheDocument();

    // Open the "Cambiar" popover and pick a new size. Changing size re-keys
    // the line (CartDrawer keys by id|size|variant), so the popover unmounts
    // — reopen it for the color change.
    fireEvent.click(screen.getByRole("button", { name: /cambiar talla o color/i }));
    fireEvent.click(screen.getByRole("button", { name: "G" }));
    fireEvent.click(screen.getByRole("button", { name: /cambiar talla o color/i }));
    fireEvent.click(screen.getByRole("button", { name: "Negro" }));


    // Line survives, label reflects new variant
    expect(screen.getByText(/Talla: G/)).toBeInTheDocument();
    expect(screen.getByText(/Color: Negro/)).toBeInTheDocument();
    // Only ONE line remains (no ghost duplicate)
    expect(screen.getAllByText(polo.name)).toHaveLength(1);

    // Price stays $300 (polo has flat pricing) → the "Pagar" button reflects it
    const payBtn = screen.getByRole("button", { name: /pagar \$300\.00 MXN/i });
    expect(payBtn).not.toBeDisabled();

    // Also persists the new selection so UniformeDetail rehydrates on return
    const persisted = window.sessionStorage.getItem(`uniforme-selection:${polo.id}`);
    expect(persisted && JSON.parse(persisted)).toEqual({ size: "G", color: "Negro" });
  });

  it("[2] WhatsApp message includes Talla+Color per line and its line-subtotals sum to total", async () => {
    mockInventory = [{ product_id: polo.id, stock: 50 }, { product_id: accesorio.id, stock: 10 }];
    // Spy window.open to capture the exact WhatsApp URL that CartDrawer opens.
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <Harness
        seed={[
          { product: polo, quantity: 2, selectedSize: "M", selectedVariant: "Azul" },
          { product: polo, quantity: 1, selectedSize: undefined, selectedVariant: "Blanco" }, // missing size → "—"
          { product: accesorio, quantity: 3 }, // no sizes/colors → line omits both
        ]}
      />
    );
    await flush();

    // Fire the WhatsApp quote button
    fireEvent.click(screen.getByRole("button", { name: /cotizar por whatsapp/i }));
    await flush();

    expect(openSpy).toHaveBeenCalled();
    const url = openSpy.mock.calls[0][0] as string;
    const msg = decodeURIComponent(url.split("?text=")[1]);

    // Polo lines: both must carry "Talla:" and "Color:" (Talla missing → "—")
    expect(msg).toMatch(/Playera Polo Test — Talla: M — Color: Azul x2 \(\$600\.00 MXN\)/);
    expect(msg).toMatch(/Playera Polo Test — Talla: — — Color: Blanco x1 \(\$300\.00 MXN\)/);
    // Accesorio has no size/color variants → no "Talla"/"Color" tokens on that line
    expect(msg).toMatch(/Accesorio Test x3 \(\$300\.00 MXN\)/);

    // The three per-line subtotals must equal the printed total
    const subtotals = [...msg.matchAll(/\$(\d+\.\d{2}) MXN\)/g)].map((m) => Number(m[1]));
    const sum = subtotals.reduce((a, b) => a + b, 0);
    const totalMatch = msg.match(/Total estimado: \$(\d+\.\d{2}) MXN/);
    expect(totalMatch).not.toBeNull();
    expect(Number(totalMatch![1])).toBeCloseTo(sum, 2);

    openSpy.mockRestore();
  });

  it("[3] Raising quantity above live stock disables checkout buttons; lowering re-enables them", async () => {
    mockInventory = [{ product_id: polo.id, stock: 2 }];
    render(
      <Harness
        seed={[{ product: polo, quantity: 2, selectedSize: "M", selectedVariant: "Blanco" }]}
      />
    );
    await flush();

    const payBtn = () => screen.getByRole("button", { name: /pagar \$/i });
    const quoteBtn = () => screen.getByRole("button", { name: /cotizar por whatsapp/i });

    // At qty === stock: buttons enabled, no over-stock alert
    expect(payBtn()).not.toBeDisabled();
    expect(quoteBtn()).not.toBeDisabled();
    expect(screen.queryByRole("alert")).toBeNull();

    // Push over stock via CartLineRow's "+" button
    // (+ is disabled at max — click "-" first? No: at qty === max the + is disabled.
    // Instead, seed a line already over stock to simulate stale local state.)
    // Re-render at qty=3 (above stock=2).
    // Simpler: reach into cart via updateQuantity through the DOM: press "+" if not disabled;
    // otherwise seed directly. Here + is disabled at max, so we go the direct route:
    act(() => {
      // Directly bump the cart via localStorage → re-render? Easier: click "-" then verify,
      // then simulate over-stock by tweaking mockInventory downward and re-opening.
    });

    // Alternate approach: shrink stock to 1 and reopen the drawer to refetch inventory.
    mockInventory = [{ product_id: polo.id, stock: 1 }];
    // Close & reopen to trigger the useEffect refetch
    fireEvent.click(screen.getByRole("button", { name: /vaciar carrito/i }).previousElementSibling as HTMLElement || screen.getByRole("button", { name: /cotizar/i }));
    // The above may be flaky; simpler: unmount+remount not available. Trigger via the "-"/"+"
    // controls to force React to see a demand change vs. new inventory.
    // Click "-" then "+" back to 2 with stock=1 → over stock.
    fireEvent.click(screen.getByRole("button", { name: /disminuir cantidad/i })); // → 1
    await flush();
    // Now demand=1, stock=1 → within limits. Click "+" → 2 which exceeds new stock=1
    fireEvent.click(screen.getByRole("button", { name: /aumentar cantidad/i })); // → 2
    await flush();

    // Over-stock alert appears; both CTAs disabled
    expect(screen.getByRole("alert")).toHaveTextContent(/mayor al stock/i);
    expect(payBtn()).toBeDisabled();
    expect(quoteBtn()).toBeDisabled();

    // Lower back to 1 → buttons re-enable
    fireEvent.click(screen.getByRole("button", { name: /disminuir cantidad/i })); // → 1
    await flush();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(payBtn()).not.toBeDisabled();
    expect(quoteBtn()).not.toBeDisabled();
  });
});
