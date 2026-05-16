import React from "react";

// Inyectados en build-time por vite.config.ts (define),
// leídos desde node_modules/{react,react-leaflet}/package.json.
declare const __REACT_LEAFLET_VERSION__: string;
declare const __REACT_VERSION__: string;

/**
 * Matriz de compatibilidad react-leaflet major → React majors soportados.
 *   3.x → 16, 17 · 4.x → 17, 18 · 5.x → 19
 */
const COMPATIBILITY: Record<string, number[]> = {
  "3": [16, 17],
  "4": [17, 18],
  "5": [19],
};

function major(version: string): string {
  return version.match(/^\d+/)?.[0] ?? "0";
}

/** react major → react-leaflet major sugerido. */
export function suggestReactLeafletMajor(reactMajor: number): string {
  if (reactMajor >= 19) return "5";
  if (reactMajor >= 17) return "4";
  return "3";
}

export interface LeafletCompatResult {
  compatible: boolean;
  /** Versión leída desde node_modules/react/package.json (build-time). */
  reactVersion: string;
  /** React.version reportada en runtime; útil para detectar desincronizaciones. */
  reactRuntimeVersion: string;
  reactLeafletVersion: string;
  expectedReactMajors: number[];
  suggestedReactLeafletMajor: string;
  /** True cuando el comando sugerido coincide con el major de React instalado. */
  suggestionMatchesInstalledReact: boolean;
  message?: string;
}

export function checkLeafletCompatibility(): LeafletCompatResult {
  // Fuente de verdad: el paquete instalado (no React.version del runtime),
  // así detectamos mismatches entre el bundle y node_modules.
  const reactVersion =
    typeof __REACT_VERSION__ !== "undefined" ? __REACT_VERSION__ : React.version;
  const reactRuntimeVersion = React.version;

  const reactLeafletVersion =
    typeof __REACT_LEAFLET_VERSION__ !== "undefined"
      ? __REACT_LEAFLET_VERSION__
      : "unknown";

  const rlMajor = major(reactLeafletVersion);
  const reactMajor = Number(major(reactVersion));
  const expected = COMPATIBILITY[rlMajor] ?? [];
  const suggestedReactLeafletMajor = suggestReactLeafletMajor(reactMajor);

  // Confirma que la sugerencia es coherente con el major instalado de React.
  const suggestionMatchesInstalledReact = (
    COMPATIBILITY[suggestedReactLeafletMajor] ?? []
  ).includes(reactMajor);

  const base = {
    reactVersion,
    reactRuntimeVersion,
    reactLeafletVersion,
    expectedReactMajors: expected,
    suggestedReactLeafletMajor,
    suggestionMatchesInstalledReact,
  };

  if (expected.length === 0) {
    return {
      ...base,
      compatible: false,
      message: `react-leaflet ${reactLeafletVersion} no está en la matriz de compatibilidad conocida.`,
    };
  }

  const compatible = expected.includes(reactMajor);
  return {
    ...base,
    compatible,
    message: compatible
      ? undefined
      : `react-leaflet ${reactLeafletVersion} requiere React ${expected.join(
          " o ",
        )}, pero la app usa React ${reactVersion}.`,
  };
}
