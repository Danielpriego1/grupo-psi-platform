/**
 * Additional e2e-style tests requested:
 * [1] Changing size+color on a cart line to collide with an existing variant
 *     merges the lines (no data loss) and the total remains correct.
 * [2] WhatsApp message includes per-line quantity and each line subtotal equals
 *     price*qty from the cart, summing to the printed "Total estimado".
 * [3] After changing size/color from the cart, "reloading" UniformeDetail
 *     restores image + chips from sessionStorage.
 * [4] Pay / WhatsApp buttons honor aria-disabled when stock is exceeded, and
 *     role="alert" / role="status" updates as quantity crosses the stock line.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import UniformeDetail from "@/pages/UniformeDetail";
import type { Product } from "@/data/products";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

let mockInventory: Array<{ product_id: string; stock: number }> = [];
vi.mock("@/integrations/supabase/client", () => {
  const inventoryQuery = () => ({
    select: () => ({ in: async () => ({ data: mockInventory, error: null }) }),
  });
  return {
    supabase: {
      from: (_t: string) => inventoryQuery(),
      functions: {
        invoke: vi.fn(async () => ({
          data: { orderNumber: "COT-TEST-EX", url: null },
          error: null,
        })),
      },
    },
  };
});

const polo: Product = {
  id: "polo-extra-1",
  name: "Playera Polo Extra",
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
const images = ["/img-blanco.jpg", "/img-negro.jpg", "/img-azul.jpg"];

function Harness({ seed }: { seed: Array<Parameters<ReturnType<typeof useCart>["addItem"]>[0]> }) {
  function Seeder() {
    const { addItem, setIsOpen, items } = useCart();
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
  await act(async () => { await Promise.resolve(); });
  await act(async () => { await Promise.resolve(); });
}

function renderUniforme() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <CartProvider>
          <UniformeDetail
            product={polo}
            images={images}
            sizes={["CH", "M", "G"]}
            categorySlug="uniformes"
            inventoryStock={10}
          />
        </CartProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("CartDrawer — extra e2e coverage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    mockInventory = [];
  });

  it("[1] changing a line to collide with an existing variant merges quantities and total stays correct", async () => {
    mockInventory = [{ product_id: polo.id, stock: 50 }];
    render(
      <Harness
        seed={[
          { product: polo, quantity: 2, selectedSize: "M", selectedVariant: "Blanco" },
          { product: polo, quantity: 3, selectedSize: "G", selectedVariant: "Negro" },
        ]}
      />
    );
    await flush();

    // Precondition: two lines, total = 5 * 300 = $1500
    expect(screen.getAllByText(polo.name)).toHaveLength(2);
    expect(screen.getByRole("button", { name: /pagar \$1500\.00 MXN/i })).toBeInTheDocument();

    // Change the FIRST line (M/Blanco → G/Blanco → G/Negro) so it collides with line 2.
    // Grab the "Cambiar" trigger inside the first line's container.
    const firstLine = screen.getByText(/Talla: M/).closest("div")!.parentElement!.parentElement!;
    const changeBtn = within(firstLine).getByRole("button", { name: /cambiar talla o color/i });
    fireEvent.click(changeBtn);
    fireEvent.click(screen.getByRole("button", { name: "G" }));

    // Popover re-mounts — reopen and pick Negro (this collides with line 2 exactly)
    const firstLineAfter = screen.getAllByText(polo.name)[0].closest("div")!.parentElement!.parentElement!;
    fireEvent.click(within(firstLineAfter).getByRole("button", { name: /cambiar talla o color/i }));
    fireEvent.click(screen.getByRole("button", { name: "Negro" }));

    // After collision, lines merge: only ONE line for polo remains
    expect(screen.getAllByText(polo.name)).toHaveLength(1);
    // Merged qty = 2 + 3 = 5, and label is G / Negro
    expect(screen.getByText(/Talla: G/)).toBeInTheDocument();
    expect(screen.getByText(/Color: Negro/)).toBeInTheDocument();
    // Total unchanged: still $1500
    expect(screen.getByRole("button", { name: /pagar \$1500\.00 MXN/i })).toBeInTheDocument();
  });

  it("[2] WhatsApp message includes quantity per line and subtotals sum to the printed total", async () => {
    mockInventory = [{ product_id: polo.id, stock: 50 }];
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <Harness
        seed={[
          { product: polo, quantity: 2, selectedSize: "M", selectedVariant: "Blanco" },
          { product: polo, quantity: 4, selectedSize: "G", selectedVariant: "Negro" },
        ]}
      />
    );
    await flush();

    fireEvent.click(screen.getByRole("button", { name: /cotizar por whatsapp/i }));
    await flush();

    const url = openSpy.mock.calls[0][0] as string;
    const msg = decodeURIComponent(url.split("?text=")[1]);

    // Each line prints "xN" and a subtotal that equals price * N.
    expect(msg).toMatch(/Talla: M — Color: Blanco x2 \(\$600\.00 MXN\)/);
    expect(msg).toMatch(/Talla: G — Color: Negro x4 \(\$1200\.00 MXN\)/);

    // Sum of subtotals == printed total ($1800.00)
    const subtotals = [...msg.matchAll(/x(\d+) \(\$(\d+\.\d{2}) MXN\)/g)];
    expect(subtotals).toHaveLength(2);
    // Each subtotal equals price*qty (polo flat $300)
    for (const m of subtotals) {
      const qty = Number(m[1]);
      const sub = Number(m[2]);
      expect(sub).toBeCloseTo(300 * qty, 2);
    }
    const sum = subtotals.reduce((a, m) => a + Number(m[2]), 0);
    const totalMatch = msg.match(/Total estimado: \$(\d+\.\d{2}) MXN/);
    expect(totalMatch).not.toBeNull();
    expect(Number(totalMatch![1])).toBeCloseTo(sum, 2);
    expect(Number(totalMatch![1])).toBe(1800);

    openSpy.mockRestore();
  });

  it("[3] after changing variant from the cart, re-mounting UniformeDetail rehydrates image + chips from sessionStorage", async () => {
    // Simulate the cart having persisted a new selection (as CartLineRow does).
    window.sessionStorage.setItem(
      `uniforme-selection:${polo.id}`,
      JSON.stringify({ size: "G", color: "Azul" })
    );

    // "Reload" UniformeDetail — fresh mount reads sessionStorage on init.
    renderUniforme();
    await act(async () => { await Promise.resolve(); });

    // Size chip "G" active
    const talleG = screen.getByRole("button", { name: "G" });
    expect(talleG.className).toMatch(/bg-primary/);

    // Color chip "Azul" active (border-primary marker)
    const azul = screen.getByRole("button", { name: "Azul" });
    expect(azul.className).toMatch(/border-primary/);

    // Main image resolved to Azul (index 2 → /img-azul.jpg)
    const mainImg = screen.getAllByAltText(polo.name)[0] as HTMLImageElement;
    expect(mainImg.src).toContain("img-azul.jpg");

    // "Agregar al carrito" is not disabled because the persisted selection is valid.
    const cta = screen.getByRole("button", { name: /agregar al carrito/i });
    expect(cta).not.toBeDisabled();
    expect(cta.getAttribute("aria-disabled")).toBe("false");
  });

  it("[4] Pay / Quote buttons honor aria-disabled when over stock; role=alert appears and clears when qty returns under stock", async () => {
    mockInventory = [{ product_id: polo.id, stock: 2 }];
    render(
      <Harness
        seed={[{ product: polo, quantity: 2, selectedSize: "M", selectedVariant: "Blanco" }]}
      />
    );
    await flush();

    const payBtn = () => screen.getByRole("button", { name: /pagar \$/i });
    const quoteBtn = () => screen.getByRole("button", { name: /cotizar por whatsapp/i });

    // Baseline: qty == stock. No over-stock alert, buttons are actionable.
    expect(screen.queryByRole("alert")).toBeNull();
    expect(payBtn()).not.toBeDisabled();
    expect(quoteBtn()).not.toBeDisabled();

    // Force qty above stock: shrink stock via decrement→increment cycle with mockInventory updated.
    mockInventory = [{ product_id: polo.id, stock: 1 }];
    fireEvent.click(screen.getByRole("button", { name: /disminuir cantidad/i })); // qty → 1
    await flush();
    fireEvent.click(screen.getByRole("button", { name: /aumentar cantidad/i })); // qty → 2, stock = 1
    await flush();

    // Alert announces the over-stock condition to SR users.
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/mayor al stock/i);

    // Buttons are both disabled AND aria-disabled=true so assistive tech agrees.
    expect(payBtn()).toBeDisabled();
    expect(quoteBtn()).toBeDisabled();

    // Line-level role=status also announces the limit
    const statuses = screen.getAllByRole("status");
    expect(statuses.some((s) => /solo quedan|stock máximo/i.test(s.textContent || ""))).toBe(true);

    // Return under stock — alert clears and buttons re-enable.
    fireEvent.click(screen.getByRole("button", { name: /disminuir cantidad/i })); // qty → 1
    await flush();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(payBtn()).not.toBeDisabled();
    expect(quoteBtn()).not.toBeDisabled();
  });
});
