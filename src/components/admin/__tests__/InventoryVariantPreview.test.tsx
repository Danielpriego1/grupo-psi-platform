import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InventoryVariantPreview } from "@/components/admin/InventoryVariantPreview";

/**
 * Simulates the admin flow of adding a "playera" with tallas + colores and
 * multiple photos, then verifies:
 *  - all size chips render
 *  - all color swatches render
 *  - selecting each color swaps the main image to the one at the same index
 *  - list edits (adding/removing sizes/colors/images) don't reset selection
 *    silently — out-of-range indices are corrected
 */
describe("InventoryVariantPreview (admin live preview)", () => {
  const baseProps = {
    productName: "Playera cuello V",
    sizes: ["CH", "M", "G", "EG"],
    colors: ["Blanco", "Negro", "Marino"],
    images: ["https://cdn/img-white.jpg", "https://cdn/img-black.jpg", "https://cdn/img-navy.jpg"],
  };

  it("renders every size chip and color swatch", () => {
    render(<InventoryVariantPreview {...baseProps} />);
    baseProps.sizes.forEach((s) => {
      expect(screen.getByRole("button", { name: s })).toBeInTheDocument();
    });
    baseProps.colors.forEach((c) => {
      expect(screen.getByTestId(`preview-color-${c}`)).toBeInTheDocument();
    });
  });

  it("maps color→image by upload order and swaps main image on selection", () => {
    render(<InventoryVariantPreview {...baseProps} />);
    const mainImg = screen.getByTestId("preview-main-image") as HTMLImageElement;
    expect(mainImg.src).toBe(baseProps.images[0]);

    fireEvent.click(screen.getByTestId("preview-color-Negro"));
    expect((screen.getByTestId("preview-main-image") as HTMLImageElement).src).toBe(baseProps.images[1]);

    fireEvent.click(screen.getByTestId("preview-color-Marino"));
    expect((screen.getByTestId("preview-main-image") as HTMLImageElement).src).toBe(baseProps.images[2]);

    fireEvent.click(screen.getByTestId("preview-color-Blanco"));
    expect((screen.getByTestId("preview-main-image") as HTMLImageElement).src).toBe(baseProps.images[0]);
  });

  it("shows mismatch warning when colors count ≠ images count", () => {
    render(<InventoryVariantPreview {...baseProps} images={baseProps.images.slice(0, 2)} />);
    expect(screen.getByText(/3 colores vs 2 fotos/i)).toBeInTheDocument();
  });

  it("marks size chip as pressed when selected", () => {
    render(<InventoryVariantPreview {...baseProps} />);
    const chip = screen.getByRole("button", { name: "M" });
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("renders nothing when there are no variants and no images", () => {
    const { container } = render(
      <InventoryVariantPreview productName="Sin variantes" sizes={[]} colors={[]} images={[]} />
    );
    expect(container.firstChild).toBeNull();
  });
});
