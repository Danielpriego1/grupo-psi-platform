import { Minus, Plus, Trash2, Settings2, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCart, type CartItem } from "@/contexts/CartContext";
import { getProductPrice } from "@/data/products";

interface Props {
  item: CartItem;
  /** Live stock from inventory; undefined means "unknown / not enforced". */
  liveStock?: number;
}

/**
 * A single cart line with quantity controls, per-line stock-aware +/-
 * enforcement, and a "change size / color" popover so the user can re-select
 * variants without deleting and re-adding the product.
 */
export function CartLineRow({ item, liveStock }: Props) {
  const { updateQuantity, removeItem, updateLine } = useCart();

  const base = getProductPrice(item.product, item.selectedSize);
  const price = item.product.discount ? base * (1 - item.product.discount) : base;

  const availableSizes = item.product.sizes
    ? Object.values(item.product.sizes).flat()
    : [];
  const colorKey = item.product.variants
    ? Object.keys(item.product.variants).find((k) => /color/i.test(k))
    : undefined;
  const availableColors = colorKey ? item.product.variants![colorKey] : [];

  const overStock = liveStock != null && item.quantity > liveStock;
  const atMax = liveStock != null && item.quantity >= liveStock;
  const showEditor = availableSizes.length > 0 || availableColors.length > 0;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-3",
        overStock ? "border-destructive/40 bg-destructive/5" : "border-border"
      )}
    >
      <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted/30">
        <img
          src={item.product.image || "/placeholder.svg"}
          alt={item.product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold line-clamp-1">{item.product.name}</h4>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {item.selectedSize && <span>Talla: {item.selectedSize}</span>}
          {item.selectedVariant && <span>Color: {item.selectedVariant}</span>}
          {showEditor && (
            <Popover>
              <PopoverTrigger
                className="inline-flex items-center gap-1 text-primary hover:underline"
                aria-label="Cambiar talla o color"
              >
                <Settings2 className="h-3 w-3" />
                Cambiar
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 space-y-3">
                {availableSizes.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Talla
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSizes.map((s) => (
                        <button
                          key={s}
                          onClick={() =>
                            updateLine(
                              item.product.id,
                              { selectedSize: item.selectedSize, selectedVariant: item.selectedVariant },
                              { selectedSize: s, selectedVariant: item.selectedVariant }
                            )
                          }
                          className={cn(
                            "min-w-[40px] h-8 rounded-md border px-2 text-xs font-semibold",
                            item.selectedSize === s
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:border-primary/40"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {availableColors.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Color
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableColors.map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            updateLine(
                              item.product.id,
                              { selectedSize: item.selectedSize, selectedVariant: item.selectedVariant },
                              { selectedSize: item.selectedSize, selectedVariant: c }
                            )
                          }
                          className={cn(
                            "h-8 rounded-md border px-2 text-xs font-semibold",
                            item.selectedVariant === c
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:border-primary/40"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>

        {(overStock || (atMax && liveStock != null)) && (
          <p
            role="status"
            className={cn(
              "mt-1 flex items-center gap-1 text-[11px] font-medium",
              overStock ? "text-destructive" : "text-amber-700"
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            {overStock
              ? `Solo quedan ${liveStock} en stock. Ajusta la cantidad.`
              : `Stock máximo alcanzado (${liveStock}).`}
          </p>
        )}

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold text-primary">
            ${(price * item.quantity).toFixed(2)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                updateQuantity(
                  item.product.id,
                  item.quantity - 1,
                  item.selectedSize,
                  item.selectedVariant
                )
              }
              className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Disminuir cantidad"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() =>
                updateQuantity(
                  item.product.id,
                  item.quantity + 1,
                  item.selectedSize,
                  item.selectedVariant
                )
              }
              disabled={atMax}
              aria-disabled={atMax}
              aria-label="Aumentar cantidad"
              className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={() =>
                removeItem(item.product.id, item.selectedSize, item.selectedVariant)
              }
              className="h-7 w-7 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-1"
              aria-label="Eliminar del carrito"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
