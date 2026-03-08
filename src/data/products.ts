export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  priceOriginalMxn: number;
  discount: number | null;
  purchaseUrl: string | null;
  purchaseStatus: string | null;
  inStock: boolean;
  variants?: Record<string, string[]>;
  sizes?: Record<string, string[]>;
  image?: string;
}

export const products: Product[] = [
  {
    id: "ext-1",
    name: "Extintor Nuevo PQS ABC 1 kg",
    category: "Extintores",
    description: "Extintor nuevo capacidad 1 kg cargado con pqs abc certificado Incluye etiqueta informativa.",
    priceOriginalMxn: 434.71,
    discount: null,
    purchaseUrl: null,
    purchaseStatus: "Available",
    inStock: true,
    variants: { kg: ["1 kg"] },
  },
  {
    id: "ext-2",
    name: "Extintor Nuevo PQS ABC 2 kg",
    category: "Extintores",
    description: "Extintor nuevo capacidad 2 kg cargado con pqs abc certificado Incluye etiqueta informativa.",
    priceOriginalMxn: 533.6,
    discount: null,
    purchaseUrl: "https://buy.stripe.com/14A28t7Ii2XF2VN7TH4wM0o",
    purchaseStatus: "Available",
    inStock: true,
    variants: { kg: ["2 kg"] },
  },
  {
    id: "ext-4_5",
    name: "Extintor Nuevo PQS ABC 4.5 kg",
    category: "Extintores",
    description: "Extintor nuevo capacidad 4.5 kg cargado con pqs abc certificado Incluye etiqueta informativa, cincho sujeta manguera y gancho para pared",
    priceOriginalMxn: 827.08,
    discount: null,
    purchaseUrl: "https://buy.stripe.com/9B6fZj8MmdCjfIzfm94wM0p",
    purchaseStatus: "Available",
    inStock: true,
    variants: { kg: ["4.5 kg"] },
  },
  {
    id: "uni-1",
    name: "Playera Cuello Redondo Manga Corta para Caballero · 100% Poliéster",
    category: "Uniformes",
    description: "Playera manga corta tela dry, cuello sport.\n• Negro\n• Azul rey\n• Rojo\n• Blanco\n• Marino",
    priceOriginalMxn: 120,
    discount: null,
    purchaseUrl: null,
    purchaseStatus: "Available",
    inStock: true,
    sizes: { sizePlayeras: ["MX 36 - CH", "MX 38 - M", "MX 40 - L", "MX 42 - XL", "MX 44 - XXL"] },
  },
  {
    id: "uni-2",
    name: "Playera Tipo Polo Manga Larga para Caballero · 100% Poliéster",
    category: "Uniformes",
    description: "Playera tipo polo manga larga 100% poliester\n• Negro\n• Blanco\n• Marino",
    priceOriginalMxn: 411.8,
    discount: 0.05,
    purchaseUrl: null,
    purchaseStatus: null,
    inStock: true,
    sizes: { sizePlayeras: ["MX 36 - CH", "MX 38 - M", "MX 40 - L", "MX 42 - XL", "MX 44 - XXL"] },
  }
];

export const getProductById = (id: string) => products.find(p => p.id === id);
