/**
 * E2E-style test: simulates reloading the Admin Inventory page mid-alta.
 *
 * Flow:
 *  1. A draft is pre-seeded in sessionStorage as if the operator had already
 *     entered "Tallas disponibles", "Colores disponibles" and uploaded remote
 *     images (only https:// URLs survive a reload — local File objects are
 *     dropped by design).
 *  2. AdminInventory mounts fresh (this represents the reload).
 *  3. The restore effect must:
 *     - reopen the create/edit dialog
 *     - refill the Tallas and Colores inputs
 *     - repopulate the image carousel in the same order
 *     - render InventoryVariantPreview with a color→image mapping that swaps
 *       the main preview image when each color chip is clicked
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminInventory from "@/pages/admin/AdminInventory";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useRealtimeTable", () => ({
  useRealtimeTable: () => {},
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: async () => ({ data: [], error: null }),
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
    }),
    storage: { from: () => ({}) },
  },
}));

const DRAFT_KEY = "admin-inventory-draft";
const IMG_WHITE = "https://cdn.example.com/playera-blanca.jpg";
const IMG_BLACK = "https://cdn.example.com/playera-negra.jpg";
const IMG_NAVY  = "https://cdn.example.com/playera-marino.jpg";

const seedDraft = () => {
  sessionStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      form: {
        product_id: "PLAY-V-001",
        product_name: "Playera cuello V",
        category: "Uniformes",
        subcategory: "Uniformes-Playeras cuello redondo caballero",
        description: "",
        stock: "20",
        min_stock: "5",
        unit_price: "250",
        location: "Almacén A",
        spec_pdf_url: "",
        sizes: "CH, M, G, EG",
        colors: "Blanco, Negro, Marino",
      },
      images: [{ url: IMG_WHITE }, { url: IMG_BLACK }, { url: IMG_NAVY }],
      pdfName: null,
      editItemId: null,
      skippedLocalImages: 0,
    }),
  );
};

describe("AdminInventory — reload during alta restores draft", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("restores Tallas, Colores and the image↔color carousel after a reload", async () => {
    seedDraft();
    render(<AdminInventory />);

    // Dialog reopens with tallas/colores filled
    const tallas = await screen.findByPlaceholderText(/ECH, CH, M, G, EG, EEG/i) as HTMLInputElement;
    const colores = await screen.findByPlaceholderText(/Blanco, Negro, Marino/i) as HTMLInputElement;
    expect(tallas.value).toBe("CH, M, G, EG");
    expect(colores.value).toBe("Blanco, Negro, Marino");

    // Live preview renders with restored images (color→image by index)
    const preview = await screen.findByTestId("inventory-variant-preview");
    expect(preview).toBeInTheDocument();

    const mainImg = screen.getByTestId("preview-main-image") as HTMLImageElement;
    expect(mainImg.src).toBe(IMG_WHITE);

    fireEvent.click(screen.getByTestId("preview-color-Negro"));
    await waitFor(() =>
      expect((screen.getByTestId("preview-main-image") as HTMLImageElement).src).toBe(IMG_BLACK),
    );

    fireEvent.click(screen.getByTestId("preview-color-Marino"));
    await waitFor(() =>
      expect((screen.getByTestId("preview-main-image") as HTMLImageElement).src).toBe(IMG_NAVY),
    );

    // Every restored size chip renders inside the preview
    ["CH", "M", "G", "EG"].forEach((s) => {
      expect(screen.getByRole("button", { name: s })).toBeInTheDocument();
    });
  });
});
