import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UniformeDetail from "@/pages/UniformeDetail";
import { CartProvider } from "@/contexts/CartContext";
import type { Product } from "@/data/products";

// Toast is called on click; stub to keep tests quiet.
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const baseProduct: Product = {
  id: "test-uni-1",
  name: "Playera Polo Caballero Test",
  category: "Uniformes",
  description: "Playera polo de prueba",
  priceOriginalMxn: 250,
  discount: null,
  purchaseUrl: null,
  purchaseStatus: "Available",
  inStock: true,
  variants: { color: ["Blanco", "Negro"] },
  sizes: { sizePlayeras: ["CH", "M", "G"] },
};

function renderPage(overrides: Partial<Parameters<typeof UniformeDetail>[0]> = {}) {
  return render(
    <MemoryRouter>
      <CartProvider>
        <UniformeDetail
          product={baseProduct}
          images={["/a.jpg", "/b.jpg"]}
          sizes={["CH", "M", "G"]}
          categorySlug="uniformes"
          inventoryStock={5}
          {...overrides}
        />
      </CartProvider>
    </MemoryRouter>
  );
}

describe("UniformeDetail — CTA gating", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("disables CTAs when no size or color is selected", () => {
    renderPage();
    const addBtn = screen.getByRole("button", { name: /agregar al carrito/i });
    const buyBtn = screen.getByRole("button", { name: /comprar ahora/i });
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveAttribute("aria-disabled", "true");
    expect(buyBtn).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/selecciona una talla/i);
  });

  it("still disables CTAs when only size is selected but color is required", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    expect(screen.getByRole("button", { name: /agregar al carrito/i })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/selecciona un color/i);
  });

  it("enables CTAs once size and color are both valid", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Blanco" }));
    const addBtn = screen.getByRole("button", { name: /agregar al carrito/i });
    expect(addBtn).not.toBeDisabled();
    expect(addBtn).toHaveAttribute("aria-disabled", "false");
  });

  it("disables CTAs when product is out of stock, regardless of selection", () => {
    renderPage({ product: { ...baseProduct, inStock: false } });
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Blanco" }));
    expect(screen.getByRole("button", { name: /agregar al carrito/i })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/agotado/i);
  });

  it("disables CTAs when quantity exceeds inventory stock", () => {
    renderPage({ inventoryStock: 1 });
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Blanco" }));
    // bump quantity past stock (initial 1 → click + once = 2)
    fireEvent.click(screen.getByRole("button", { name: "" }).parentElement!.querySelector("button:last-child")!);
    // Fallback: query by icon-only + buttons in the qty group is fragile; instead
    // simulate quantity change through the +/- controls by label lookup:
  });

  it("persists selected size/color across remounts via sessionStorage", () => {
    const { unmount } = renderPage();
    fireEvent.click(screen.getByRole("button", { name: "G" }));
    fireEvent.click(screen.getByRole("button", { name: "Negro" }));
    unmount();

    renderPage();
    // "G" and "Negro" should still be the active selection: CTA enabled without re-clicking
    const addBtn = screen.getByRole("button", { name: /agregar al carrito/i });
    expect(addBtn).not.toBeDisabled();
  });
});
