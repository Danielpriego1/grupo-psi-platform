/**
 * Ask 4: after modifying a cart line (size/color), returning to UniformeDetail
 * must rehydrate that same variant — the main image reflects the new color and
 * the size/color chips show the active (highlighted) state.
 *
 * We render CartLineRow standalone (avoids CartDrawer's Supabase surface),
 * change the variant via the "Cambiar" popover, then mount UniformeDetail and
 * assert the restored selection + gallery.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { CartLineRow } from "@/components/cart/CartLineRow";
import UniformeDetail from "@/pages/UniformeDetail";
import type { Product } from "@/data/products";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const product: Product = {
  id: "polo-ask4-1",
  name: "Playera Polo Ask4",
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

/** Renders a single CartLineRow reading from the cart context. */
function LineHarness() {
  const { items } = useCart();
  if (items.length === 0) return null;
  return <CartLineRow item={items[0]} liveStock={99} />;
}

function Seeder({ size, color }: { size: string; color: string }) {
  const { addItem, items } = useCart();
  if (items.length === 0) {
    addItem({ product, quantity: 1, selectedSize: size, selectedVariant: color });
  }
  return null;
}

function renderUniforme() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <CartProvider>
          <UniformeDetail
            product={product}
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

describe("Cart → UniformeDetail rehydration after changing a line", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("changes color in the cart and restores it on UniformeDetail (image + chip state)", async () => {
    // 1) Mount the "cart line" with initial variant M/Blanco
    const { unmount } = render(
      <CartProvider>
        <Seeder size="M" color="Blanco" />
        <LineHarness />
      </CartProvider>
    );

    // 2) Open the "Cambiar" popover and switch color to Azul (index 2)
    fireEvent.click(screen.getByRole("button", { name: /cambiar talla o color/i }));
    fireEvent.click(screen.getByRole("button", { name: "Azul" }));

    // The line label reflects the change without deleting the line
    expect(screen.getByText(/Talla: M/)).toBeInTheDocument();
    expect(screen.getByText(/Color: Azul/)).toBeInTheDocument();

    // Session storage is now seeded by CartLineRow.persistSelection
    expect(
      JSON.parse(window.sessionStorage.getItem(`uniforme-selection:${product.id}`)!)
    ).toEqual({ size: "M", color: "Azul" });

    unmount();

    // 3) Return to UniformeDetail
    renderUniforme();
    await act(async () => { await Promise.resolve(); });

    // 3a) Size chip "M" is active (bg-primary marker used by the component)
    const talleM = screen.getByRole("button", { name: "M" });
    expect(talleM.className).toMatch(/bg-primary/);

    // 3b) Color chip "Azul" is active
    const azul = screen.getByRole("radio", { name: "Azul" });
    expect(azul.className).toMatch(/border-primary/);

    // 3c) Main image resolved to Azul (index 2 → /img-azul.jpg)
    const mainImg = screen.getAllByAltText(product.name)[0] as HTMLImageElement;
    expect(mainImg.src).toContain("img-azul.jpg");

    // 3d) CTA is enabled (selection is fully valid)
    expect(screen.getByRole("button", { name: /agregar al carrito/i })).not.toBeDisabled();
  });
});
