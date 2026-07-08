import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";

export interface InventoryProduct extends Product {
  fromInventory: true;
  subcategory: string | null;
  specPdfUrl: string | null;
  stock: number;
}

export function useInventoryCatalog() {
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("inventory")
        .select("*")
        .not("image_url", "is", null)
        .gt("unit_price", 0)
        .order("product_name");

      if (data) {
        const products: InventoryProduct[] = data
          .filter((item) => {
            const img = (item.image_url || "").trim();
            return img.length > 0 && Number(item.unit_price) > 0;
          })
          .map((item) => {
            const sizes = Array.isArray((item as any).sizes) ? ((item as any).sizes as string[]).filter(Boolean) : [];
            const colors = Array.isArray((item as any).colors) ? ((item as any).colors as string[]).filter(Boolean) : [];
            return {
              id: item.product_id,
              name: item.product_name,
              category: item.subcategory
                ? item.subcategory.split("-").slice(0, 1).join("")
                : item.category || "EPP",
              description: `${item.product_name}. ${item.category ? `Categoría: ${item.category}.` : ""} ${item.subcategory ? `Subcategoría: ${item.subcategory}.` : ""}`,
              priceOriginalMxn: Number(item.unit_price),
              discount: null,
              purchaseUrl: null,
              purchaseStatus: "Available",
              inStock: item.stock > 0,
              image: item.image_url || undefined,
              images: Array.isArray((item as any).image_urls) && (item as any).image_urls.length
                ? (item as any).image_urls
                : (item.image_url ? [item.image_url] : []),
              sizes: sizes.length ? { sizeGeneric: sizes } : undefined,
              variants: colors.length ? { color: colors } : undefined,
              fromInventory: true,
              subcategory: (item as any).subcategory || null,
              specPdfUrl: (item as any).spec_pdf_url || null,
              stock: item.stock,
            } as InventoryProduct;
          });

        setInventoryProducts(products);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { inventoryProducts, loading };
}

export function getInventoryCategories(products: InventoryProduct[]): string[] {
  const subcats = new Set(products.map((p) => p.subcategory).filter(Boolean) as string[]);
  return [...subcats].sort();
}
