/**
 * End-to-end style integration test for the size+color selection lifecycle:
 * UniformeDetail → add to cart → navigate away → come back → verify the same
 * variant is restored AND the gallery image matches the selected color index.
 *
 * We use React Testing Library at the router boundary so this exercises the
 * real CartContext, real sessionStorage persistence, and real ProductDetail →
 * UniformeDetail dispatch — no mocks of app internals.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import UniformeDetail from "@/pages/UniformeDetail";
import { CartProvider, useCart } from "@/contexts/CartContext";
import type { Product } from "@/data/products";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const product: Product = {
  id: "polo-e2e-1",
  name: "Playera Polo Test E2E",
  category: "Uniformes",
  description: "Polo de prueba",
  priceOriginalMxn: 300,
  discount: null,
  purchaseUrl: null,
  purchaseStatus: "Available",
  inStock: true,
  variants: { color: ["Blanco", "Negro", "Azul"] },
  sizes: { sizePlayeras: ["CH", "M", "G"] },
};

const images = ["/img-blanco.jpg", "/img-negro.jpg", "/img-azul.jpg"];

// Fake "cart page" that shows what's inside the cart and links back.
function FakeCartPage() {
  const { items } = useCart();
  return (
    <div>
      <h1>Carrito</h1>
      <ul>
        {items.map((i, idx) => (
          <li key={idx}>
            {i.product.name} | Talla: {i.selectedSize} | Color: {i.selectedVariant} | x{i.quantity}
          </li>
        ))}
      </ul>
      <Link to="/uniforme">Volver al producto</Link>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <MemoryRouter initialEntries={["/uniforme"]}>
        <CartProvider>
          <Routes>
            <Route
              path="/uniforme"
              element={
                <>
                  <Link to="/cart">Ir al carrito</Link>
                  <UniformeDetail
                    product={product}
                    images={images}
                    sizes={["CH", "M", "G"]}
                    categorySlug="uniformes"
                    inventoryStock={10}
                  />
                </>
              }
            />
            <Route path="/cart" element={<FakeCartPage />} />
          </Routes>
        </CartProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("UniformeDetail ↔ Cart round-trip", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("selects size+color, adds to cart, returns, and restores the same variant + image", async () => {
    render(<App />);

    // 1) Pick talla M and color "Negro" (index 1 → image should switch to /img-negro.jpg)
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Negro" }));

    // Main image reflects the selected color's index
    const mainImg = screen.getAllByAltText(product.name)[0] as HTMLImageElement;
    expect(mainImg.src).toContain("img-negro.jpg");

    // 2) Add to cart
    fireEvent.click(screen.getByRole("button", { name: /agregar al carrito/i }));

    // 3) Navigate to cart page and confirm the variant landed there exactly
    fireEvent.click(screen.getByRole("link", { name: /ir al carrito/i }));
    expect(screen.getByText(/Talla: M \| Color: Negro \| x1/)).toBeInTheDocument();

    // 4) Return to the product page
    fireEvent.click(screen.getByRole("link", { name: /volver al producto/i }));

    // 5) Selection is restored: CTA is enabled without re-clicking
    const addBtn = screen.getByRole("button", { name: /agregar al carrito/i });
    expect(addBtn).not.toBeDisabled();

    // 5a) Size + color chips are marked active (their aria/text state)
    const talleM = screen.getByRole("button", { name: "M" });
    expect(talleM.className).toMatch(/bg-primary/);

    // 5b) The main image was re-synced to the persisted color ("Negro" → index 1)
    // The color-change effect runs on mount because selectedColor was hydrated
    // from sessionStorage, so currentImage must be 1 → /img-negro.jpg
    await act(async () => { /* flush effects */ });
    const restoredImg = screen.getAllByAltText(product.name)[0] as HTMLImageElement;
    expect(restoredImg.src).toContain("img-negro.jpg");
  });
});
