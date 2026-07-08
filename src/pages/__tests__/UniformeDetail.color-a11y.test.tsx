/**
 * A11y tests for the color-swatch radiogroup in UniformeDetail:
 *  - swatches expose role="radio" with aria-checked reflecting the selection
 *  - the group is a role="radiogroup" labelled by the visible "Color" label
 *  - roving tabindex: only the active (or first, when none selected) swatch
 *    is reachable via Tab; the rest are removed from the tab order
 *  - Arrow keys move focus AND selection between swatches, and wrap around
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import UniformeDetail from "@/pages/UniformeDetail";
import type { Product } from "@/data/products";

const polo: Product = {
  id: "a11y-polo",
  name: "Playera Polo A11y",
  category: "Uniformes",
  description: "",
  priceOriginalMxn: 200,
  discount: null,
  purchaseUrl: null,
  purchaseStatus: "Available",
  inStock: true,
  variants: { color: ["Blanco", "Negro", "Marino"] },
  sizes: { sizePlayeras: ["CH", "M", "G"] },
};

const setup = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <CartProvider>
          <UniformeDetail
            product={polo}
            images={["/img-white.jpg", "/img-black.jpg", "/img-navy.jpg"]}
            sizes={["CH", "M", "G"]}
            categorySlug="uniformes"
            inventoryStock={10}
          />
        </CartProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );

describe("UniformeDetail color swatches — accessibility", () => {
  it("renders a labelled radiogroup with radio swatches", () => {
    setup();
    const group = screen.getByRole("radiogroup", { name: /color/i });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("applies roving tabindex — only the active (or first) swatch is tabbable", () => {
    setup();
    const [blanco, negro, marino] = screen.getAllByRole("radio");
    // No selection yet → first is tabbable
    expect(blanco.tabIndex).toBe(0);
    expect(negro.tabIndex).toBe(-1);
    expect(marino.tabIndex).toBe(-1);

    fireEvent.click(negro);
    expect(negro).toHaveAttribute("aria-checked", "true");
    expect(blanco).toHaveAttribute("aria-checked", "false");
    expect(negro.tabIndex).toBe(0);
    expect(blanco.tabIndex).toBe(-1);
    expect(marino.tabIndex).toBe(-1);
  });

  it("moves selection with ArrowRight/ArrowLeft/Home/End and wraps around", () => {
    setup();
    const [blanco, negro, marino] = screen.getAllByRole("radio");

    fireEvent.click(blanco);
    fireEvent.keyDown(blanco, { key: "ArrowRight" });
    expect(negro).toHaveAttribute("aria-checked", "true");

    fireEvent.keyDown(negro, { key: "ArrowRight" });
    expect(marino).toHaveAttribute("aria-checked", "true");

    // Wrap forward: Marino → Blanco
    fireEvent.keyDown(marino, { key: "ArrowRight" });
    expect(blanco).toHaveAttribute("aria-checked", "true");

    // Wrap backward: Blanco → Marino
    fireEvent.keyDown(blanco, { key: "ArrowLeft" });
    expect(marino).toHaveAttribute("aria-checked", "true");

    // Home → first
    fireEvent.keyDown(marino, { key: "Home" });
    expect(blanco).toHaveAttribute("aria-checked", "true");

    // End → last
    fireEvent.keyDown(blanco, { key: "End" });
    expect(marino).toHaveAttribute("aria-checked", "true");
  });
});
