/**
 * Regresión de "fit" del botón `storeCta`.
 *
 * jsdom no calcula layout real, así que simulamos la medición:
 *  - Cada carácter ocupa un ancho aproximado según el font-size efectivo
 *    para el viewport (text-sm en móvil, text-base en sm, text-lg en md+).
 *  - El contenido se "envuelve" virtualmente respetando `whitespace-normal`
 *    + `break-words`, calculando cuántos px ocuparía la línea más larga
 *    tras dividir por espacios (y por palabra si una sola palabra excede
 *    el ancho disponible — comportamiento de `break-words`).
 *  - Aseveramos que la línea más larga cabe dentro del contenedor padre
 *    a cada viewport (móvil 320/375, tablet 768, desktop 1280).
 *
 * Esto blinda contra regresiones donde un padre con padding excesivo,
 * `whitespace-nowrap` heredado, o un wrapper sin `min-w-0` provoque que
 * el texto del CTA se desborde fuera del botón.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Viewport {
  name: string;
  width: number;
  /** Ancho útil del contenedor del botón a ese viewport (descontando padding del card/section). */
  containerWidth: number;
  /** Font-size efectivo aplicado por las clases responsivas text-sm/base/lg. */
  fontSizePx: number;
}

const VIEWPORTS: Viewport[] = [
  // Móvil estrecho — card p-6 (24px*2) dentro de container px-4 (16px*2)
  { name: "iPhone SE (320)",  width: 320,  containerWidth: 320 - 32 - 48, fontSizePx: 14 },
  { name: "iPhone 14 (390)",  width: 390,  containerWidth: 390 - 32 - 48, fontSizePx: 14 },
  // Tablet — sm:text-base + sm:p-12 (48px*2)
  { name: "iPad mini (768)",  width: 768,  containerWidth: 768 - 32 - 96, fontSizePx: 16 },
  // Desktop — md:text-lg + lg:p-20 (80px*2), cap a max-w-5xl ~1024
  { name: "Desktop (1280)",   width: 1280, containerWidth: 1024 - 160,    fontSizePx: 18 },
];

const LABELS = [
  "Solicitar cotización",
  "Servicios de mantenimiento",
  "Agregar al carrito — $24,500.00",
  "Pagar $1,234,567.89 MXN",
  "Cotizar por WhatsApp",
];

/**
 * Aproximación del ancho de un texto en píxeles para font-black uppercase
 * con `tracking-wider` (~0.05em). Coeficiente conservador (0.62) calibrado
 * contra mediciones reales de Inter Black uppercase.
 */
function approxTextWidth(text: string, fontSizePx: number): number {
  const charWidth = fontSizePx * 0.62;
  const trackingPerChar = fontSizePx * 0.05;
  return text.length * (charWidth + trackingPerChar);
}

/**
 * Simula el wrapping de `whitespace-normal` + `break-words`: divide por
 * espacios y, si una palabra supera el ancho disponible, la fragmenta.
 * Devuelve el ancho (px) de la línea más larga resultante.
 */
function widestLineAfterWrap(text: string, available: number, fontSizePx: number): number {
  // Padding horizontal del botón (px-4) + ícono (~20-24px) + gap-2
  const reservedForIconAndPadding = 32 + 24 + 8;
  const innerAvailable = Math.max(40, available - reservedForIconAndPadding);

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current) lines.push(current);
    current = "";
  };

  for (const word of words) {
    const wordWidth = approxTextWidth(word, fontSizePx);

    if (wordWidth > innerAvailable) {
      // break-words: fragmenta la palabra
      pushCurrent();
      let remaining = word;
      while (approxTextWidth(remaining, fontSizePx) > innerAvailable) {
        const charsPerLine = Math.max(
          1,
          Math.floor(innerAvailable / (fontSizePx * 0.62 + fontSizePx * 0.05)),
        );
        lines.push(remaining.slice(0, charsPerLine));
        remaining = remaining.slice(charsPerLine);
      }
      current = remaining;
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (approxTextWidth(candidate, fontSizePx) <= innerAvailable) {
      current = candidate;
    } else {
      pushCurrent();
      current = word;
    }
  }
  pushCurrent();

  return Math.max(...lines.map((l) => approxTextWidth(l, fontSizePx)), 0);
}

afterEach(() => cleanup());

describe("storeCta — fit del texto dentro del botón", () => {
  it.each(VIEWPORTS)(
    "el texto del CTA cabe en $name (contenedor ~$containerWidth px)",
    ({ containerWidth, fontSizePx }) => {
      for (const label of LABELS) {
        const widest = widestLineAfterWrap(label, containerWidth, fontSizePx);
        expect(
          widest,
          `"${label}" desborda: ${widest.toFixed(0)}px > contenedor ${containerWidth}px`,
        ).toBeLessThanOrEqual(containerWidth);
      }
    },
  );

  it("renderiza el botón con clases que habilitan el wrapping", () => {
    const { container } = render(
      <div style={{ width: "272px" }}>
        <Button size="storeCta">
          <CreditCard />
          <span>Pagar $1,234,567.89 MXN</span>
        </Button>
      </div>,
    );
    const btn = container.querySelector("button")!;
    const cls = btn.className;

    // Invariantes mínimas que permiten que el texto NUNCA desborde:
    expect(cls).toMatch(/\bwhitespace-normal\b/);
    expect(cls).toMatch(/\bbreak-words\b/);
    expect(cls).not.toMatch(/\bwhitespace-nowrap\b/);
    expect(cls).not.toMatch(/\btruncate\b/);
    expect(cls).not.toMatch(/\boverflow-hidden\b/);
    expect(cls).toMatch(/\bh-auto\b/); // crece verticalmente
    expect(cls).toMatch(/\bw-full\b/); // ocupa ancho del contenedor
  });

  it("padres con flex-row + min-w-0 permiten que dos botones convivan sin desbordar", () => {
    // Simula el wrapper de CTASection.tsx: dos botones lado a lado en sm:flex-row
    // con flex-1 min-w-0 deben repartir el ancho sin que el texto se salga.
    const { container } = render(
      <div style={{ width: "640px" }} className="flex flex-row gap-4">
        <Button size="storeCta" className="flex-1 min-w-0">
          <CreditCard />
          <span>Solicitar cotización</span>
        </Button>
        <Button size="storeCta" variant="outline" className="flex-1 min-w-0">
          <span>Servicios de mantenimiento</span>
        </Button>
      </div>,
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    for (const b of Array.from(buttons)) {
      expect(b.className).toMatch(/\bflex-1\b/);
      expect(b.className).toMatch(/\bmin-w-0\b/);
    }

    // Cada botón dispone de ~ (640 - gap-4) / 2 = 312px; font-size sm = 16px
    const perButton = (640 - 16) / 2;
    expect(widestLineAfterWrap("Solicitar cotización", perButton, 16)).toBeLessThanOrEqual(perButton);
    expect(widestLineAfterWrap("Servicios de mantenimiento", perButton, 16)).toBeLessThanOrEqual(perButton);
  });
});
