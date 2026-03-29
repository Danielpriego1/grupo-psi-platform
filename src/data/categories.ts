import { Flame, ShieldCheck, Shirt, Wrench } from "lucide-react";

export interface CategoryConfig {
  slug: string;
  name: string;
  icon: typeof Flame;
  description: string;
  subcategories: string[];
}

export const categories: CategoryConfig[] = [
  {
    slug: "equipos-contra-fuego",
    name: "Equipos contra fuego",
    icon: Flame,
    description: "Extintores, unidades móviles y accesorios contra incendio",
    subcategories: ["Extintores", "Unidades Móviles", "Accesorios"],
  },
  {
    slug: "epp",
    name: "EPP",
    icon: ShieldCheck,
    description: "Equipo de Protección Personal certificado",
    subcategories: [
      "Guantes",
      "Overoles",
      "Protección auditiva",
      "Protección Cabeza",
      "Protección Alturas",
      "Protección Pies",
      "Protección respiratoria",
      "Protección visual",
      "Señalización",
      "Primeros Auxilios",
    ],
  },
  {
    slug: "uniformes",
    name: "Uniformes",
    icon: Shirt,
    description: "Playeras, camisas y ropa corporativa",
    subcategories: [
      "Playeras tipo polo",
      "Playera cuello redondo",
      "Camisas",
      "Sudaderas",
      "Chalecos",
    ],
  },
  {
    slug: "mantenimiento",
    name: "Mantenimiento",
    icon: Wrench,
    description: "Servicio de recarga, inspección y certificación",
    subcategories: ["Recarga de extintores", "Inspección", "Certificación"],
  },
];

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug) || null;
}

/**
 * Maps a product's old category string to the new { mainCategory, subcategory } structure.
 * Used for static products defined in products.ts.
 */
export function mapStaticCategory(oldCategory: string): {
  mainCategory: string;
  subcategory: string;
} {
  switch (oldCategory) {
    case "Extintores":
      return { mainCategory: "equipos-contra-fuego", subcategory: "Extintores" };
    case "Protección pies":
      return { mainCategory: "epp", subcategory: "Protección Pies" };
    case "Overoles":
      return { mainCategory: "epp", subcategory: "Overoles" };
    case "EPP":
      return { mainCategory: "epp", subcategory: "EPP" };
    case "Uniformes":
      return { mainCategory: "uniformes", subcategory: "Playeras tipo polo" };
    default:
      return { mainCategory: "epp", subcategory: oldCategory };
  }
}

/**
 * Maps an inventory subcategory string (e.g. "EPP-Guantes") to { mainCategory, subcategory }
 */
export function mapInventorySubcategory(
  category: string | null,
  subcategory: string | null
): { mainCategory: string; subcategory: string } {
  const sub = subcategory || "";

  // EPP-* pattern
  if (sub.startsWith("EPP-")) {
    const label = sub.replace("EPP-", "").replace(/-/g, " ");
    // Map known labels
    const map: Record<string, string> = {
      Guantes: "Guantes",
      "Proteccion Pies": "Protección Pies",
      "Protección Pies": "Protección Pies",
      Overoles: "Overoles",
      "Proteccion Cabeza": "Protección Cabeza",
      "Protección Cabeza": "Protección Cabeza",
      "Proteccion Alturas": "Protección Alturas",
      "Protección Alturas": "Protección Alturas",
      "Proteccion respiratoria": "Protección respiratoria",
      "Protección respiratoria": "Protección respiratoria",
      "Proteccion auditiva": "Protección auditiva",
      "Protección auditiva": "Protección auditiva",
      "Proteccion visual": "Protección visual",
      "Protección visual": "Protección visual",
      Señalizacion: "Señalización",
      Señalización: "Señalización",
      "Primeros Auxilios": "Primeros Auxilios",
    };
    return { mainCategory: "epp", subcategory: map[label] || label };
  }

  // Equipos contra fuego
  if (
    category === "Equipos contra fuego" ||
    category === "Extintores" ||
    sub.toLowerCase().includes("extintor")
  ) {
    return { mainCategory: "equipos-contra-fuego", subcategory: sub || "Extintores" };
  }

  // Uniformes
  if (category === "Uniformes" || sub.toLowerCase().includes("playera") || sub.toLowerCase().includes("camisa")) {
    return { mainCategory: "uniformes", subcategory: sub || "Playeras tipo polo" };
  }

  // Mantenimiento
  if (category === "Mantenimiento") {
    return { mainCategory: "mantenimiento", subcategory: sub || "Mantenimiento" };
  }

  // Default to EPP
  return { mainCategory: "epp", subcategory: sub || category || "EPP" };
}
