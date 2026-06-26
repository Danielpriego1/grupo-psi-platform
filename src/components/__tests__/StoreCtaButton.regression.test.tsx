/**
 * Regresión de alineación del botón `storeCta`.
 *
 * Estos tests no producen un snapshot pixel-perfect (jsdom no renderiza),
 * pero blindan los invariantes de layout que garantizan que el texto del
 * CTA permanece centrado y no se desborda en móvil/tablet con precios
 * de distinta longitud:
 *
 *  - whitespace-normal + break-words   → permite envolver precios largos
 *  - text-center + justify-center      → mantiene el contenido centrado
 *  - h-auto + min-h-14 + py-4          → crece verticalmente, nunca recorta
 *  - escala responsiva text-sm→lg      → reduce tamaño en móvil
 *  - [&_svg]:shrink-0                  → el ícono nunca empuja el texto
 *
 * Se ejecuta en viewports simulados: iPhone SE, iPhone Pro, iPad y Android.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIEWPORTS = [
  { name: "iPhone SE",  width: 320,  height: 568  },
  { name: "iPhone 14",  width: 390,  height: 844  },
  { name: "Android M",  width: 412,  height: 915  },
  { name: "iPad mini",  width: 768,  height: 1024 },
  { name: "iPad Pro",   width: 1024, height: 1366 },
] as const;

const PRICE_LABELS = [
  "Pagar $0.00 MXN",
  "Pagar $1,299.00 MXN",
  "Pagar $24,500.00 MXN",
  "Pagar $1,234,567.89 MXN", // caso extremo
];

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth",  { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

afterEach(() => cleanup());

describe("storeCta — invariantes de tipografía y alineación", () => {
  beforeEach(() => setViewport(390, 844));

  it("aplica las clases responsivas y de envoltura esperadas", () => {
    render(
      <Button size="storeCta">
        <CreditCard />
        <span>Pagar $24,500.00 MXN</span>
      </Button>,
    );
    const btn = screen.getByRole("button");
    const cls = btn.className;

    // Layout flex centrado
    expect(cls).toMatch(/\binline-flex\b/);
    expect(cls).toMatch(/\bitems-center\b/);
    expect(cls).toMatch(/\bjustify-center\b/);
    expect(cls).toMatch(/\btext-center\b/);

    // Crecimiento vertical seguro
    expect(cls).toMatch(/\bh-auto\b/);
    expect(cls).toMatch(/\bmin-h-14\b/);
    expect(cls).toMatch(/\bpy-4\b/);
    expect(cls).toMatch(/\bw-full\b/);

    // Envoltura — sin desbordamiento horizontal
    expect(cls).toMatch(/\bwhitespace-normal\b/);
    expect(cls).toMatch(/\bbreak-words\b/);
    expect(cls).toMatch(/\bleading-tight\b/);
    expect(cls).not.toMatch(/\bwhitespace-nowrap\b/); // no debe heredar el default

    // Escala tipográfica responsiva
    expect(cls).toMatch(/\btext-sm\b/);
    expect(cls).toMatch(/sm:text-base/);
    expect(cls).toMatch(/md:text-lg/);
    expect(cls).toMatch(/\bfont-black\b/);
    expect(cls).toMatch(/\buppercase\b/);
    expect(cls).toMatch(/tracking-wider/);

    // Ícono fijo (no empuja el texto al envolver)
    expect(cls).toMatch(/\[&_svg\]:shrink-0/);
  });

  it.each(VIEWPORTS)(
    "mantiene alineación en $name ($width×$height) con cualquier precio",
    ({ width, height }) => {
      setViewport(width, height);

      for (const label of PRICE_LABELS) {
        const { unmount } = render(
          <div style={{ width: `${width}px` }}>
            <Button size="storeCta">
              <CreditCard />
              <span>{label}</span>
            </Button>
          </div>,
        );

        const btn = screen.getByRole("button");

        // El span de texto debe existir y conservar el contenido íntegro
        const text = screen.getByText(label);
        expect(text).toBeInTheDocument();
        expect(text.textContent).toBe(label);

        // El botón nunca debe llevar overflow:hidden ni truncate — el texto
        // debe poder envolver, no recortarse, en pantallas estrechas.
        const cls = btn.className;
        expect(cls).not.toMatch(/\btruncate\b/);
        expect(cls).not.toMatch(/\boverflow-hidden\b/);

        // El ícono está marcado como shrink-0 vía CSS arbitrary selector,
        // así que el SVG sigue presente como hermano del texto y no se
        // separa al envolver.
        const svg = btn.querySelector("svg");
        expect(svg).not.toBeNull();
        expect(btn.contains(text)).toBe(true);
        expect(btn.contains(svg!)).toBe(true);

        unmount();
      }
    },
  );

  it("comparte la misma firma de clases entre variantes default y outline", () => {
    const { container: a } = render(
      <Button size="storeCta" variant="default">Pagar $99 MXN</Button>,
    );
    const { container: b } = render(
      <Button size="storeCta" variant="outline">Cotizar por WhatsApp</Button>,
    );
    const sizeClasses = [
      "w-full", "h-auto", "min-h-14", "py-4",
      "whitespace-normal", "break-words", "leading-tight",
      "text-center", "uppercase", "font-black",
    ];
    for (const c of sizeClasses) {
      expect(a.querySelector("button")!.className).toContain(c);
      expect(b.querySelector("button")!.className).toContain(c);
    }
  });
});
