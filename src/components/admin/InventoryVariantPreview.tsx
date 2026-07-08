import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

/**
 * Live preview used inside AdminInventory's create/edit dialog so the operator
 * can see how the storefront will render the size chips, color swatches and
 * image↔color mapping BEFORE saving. Selecting a color swaps the main image
 * to the one uploaded at the same index — matching UniformeDetail behavior.
 */

const COLOR_SWATCHES: Record<string, string> = {
  blanco: "#ffffff",
  negro: "#111111",
  gris: "#9ca3af",
  "gris oxford": "#4b5563",
  azul: "#1e3a8a",
  "azul marino": "#0b1e3f",
  "azul rey": "#1d4ed8",
  marino: "#0b1e3f",
  rojo: "#b91c1c",
  verde: "#166534",
  amarillo: "#eab308",
  naranja: "#ea580c",
  beige: "#d6c7a1",
  cafe: "#78350f",
  café: "#78350f",
  vino: "#7f1d1d",
  rosa: "#f472b6",
  morado: "#7c3aed",
};

export interface InventoryVariantPreviewProps {
  productName: string;
  sizes: string[];
  colors: string[];
  images: string[];
}

export function InventoryVariantPreview({ productName, sizes, colors, images }: InventoryVariantPreviewProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [imgIdx, setImgIdx] = useState(0);

  // Keep selections in bounds when the operator edits lists in real time.
  useEffect(() => {
    if (selectedSize && !sizes.includes(selectedSize)) setSelectedSize("");
  }, [sizes, selectedSize]);
  useEffect(() => {
    if (selectedColor && !colors.includes(selectedColor)) setSelectedColor("");
  }, [colors, selectedColor]);
  useEffect(() => {
    if (imgIdx >= images.length) setImgIdx(0);
  }, [images.length, imgIdx]);

  // Match UniformeDetail: color index → image index
  useEffect(() => {
    if (!selectedColor) return;
    const i = colors.indexOf(selectedColor);
    if (i >= 0 && i < images.length) setImgIdx(i);
  }, [selectedColor, colors, images.length]);

  const hasAnything = sizes.length > 0 || colors.length > 0 || images.length > 0;
  const mismatch = colors.length > 0 && images.length > 0 && colors.length !== images.length;

  const currentImage = useMemo(() => images[imgIdx] ?? images[0] ?? null, [images, imgIdx]);

  if (!hasAnything) return null;

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
      data-testid="inventory-variant-preview"
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Vista previa (cliente)
        </div>
        {mismatch && (
          <div className="text-[10px] font-semibold uppercase text-amber-400">
            {colors.length} colores vs {images.length} fotos
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 items-start">
        {/* Main image */}
        <div className="aspect-square rounded-lg bg-white overflow-hidden border border-white/10 flex items-center justify-center">
          {currentImage ? (
            <img
              src={currentImage}
              alt={productName || "Vista previa"}
              className="w-full h-full object-contain p-2"
              data-testid="preview-main-image"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-slate-300" />
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm font-bold text-foreground truncate">
            {productName || "Nombre del producto"}
          </div>

          {sizes.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Talla</div>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    aria-pressed={selectedSize === s}
                    className={cn(
                      "min-w-[40px] h-8 rounded-md border px-2 text-xs font-semibold transition-all",
                      selectedSize === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/20 bg-white/5 text-foreground hover:border-white/40"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Color{selectedColor && <span className="ml-1 normal-case font-normal text-foreground/80">— {selectedColor}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((c, i) => {
                  const swatch = COLOR_SWATCHES[c.toLowerCase()] || "#e5e7eb";
                  const active = selectedColor === c;
                  const hasImage = i < images.length;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      title={hasImage ? c : `${c} (sin foto en la posición ${i + 1})`}
                      aria-label={c}
                      aria-pressed={active}
                      data-testid={`preview-color-${c}`}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all relative",
                        active ? "border-primary ring-2 ring-primary/40 scale-105" : "border-white/30 hover:border-white/60",
                        !hasImage && "opacity-60"
                      )}
                      style={{ backgroundColor: swatch }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {images.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pt-1">
              {images.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  aria-label={`Foto ${i + 1}`}
                  className={cn(
                    "h-12 w-12 shrink-0 rounded-md overflow-hidden border-2 bg-white",
                    i === imgIdx ? "border-primary" : "border-white/20"
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
