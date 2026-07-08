import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, getProductPrice } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedVariant?: string;
  serviceType?: "delivery" | "maintenance";
  date?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, selectedSize?: string, selectedVariant?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedVariant?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// A cart line is uniquely identified by product + size + color-variant so that
// two variants of the same product can coexist and be managed independently.
const sameLine = (a: CartItem, b: { product: { id: string }; selectedSize?: string; selectedVariant?: string }) =>
  a.product.id === b.product.id &&
  (a.selectedSize || "") === (b.selectedSize || "") &&
  (a.selectedVariant || "") === (b.selectedVariant || "");

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("psi-cart");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("psi-cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, newItem));
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + newItem.quantity } : i
        );
      }
      return [...prev, newItem];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: string, selectedSize?: string, selectedVariant?: string) => {
    setItems((prev) =>
      prev.filter((i) => !sameLine(i, { product: { id: productId }, selectedSize, selectedVariant }))
    );
  };

  const updateQuantity = (productId: string, quantity: number, selectedSize?: string, selectedVariant?: string) => {
    if (quantity <= 0) return removeItem(productId, selectedSize, selectedVariant);
    setItems((prev) =>
      prev.map((i) =>
        sameLine(i, { product: { id: productId }, selectedSize, selectedVariant })
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const base = getProductPrice(i.product, i.selectedSize);
    const price = i.product.discount
      ? base * (1 - i.product.discount)
      : base;
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
