import React from "react";

// Inyectado en build-time por vite.config.ts (define).
declare const __REACT_LEAFLET_VERSION__: string;

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

export interface LeafletCompatResult {
  compatible: boolean;
  reactVersion: string;
  reactLeafletVersion: string;
  expectedReactMajors: number[];
  message?: string;
}

export function checkLeafletCompatibility(): LeafletCompatResult {
  const reactVersion = React.version;
  const reactLeafletVersion =
    typeof __REACT_LEAFLET_VERSION__ !== "undefined"
      ? __REACT_LEAFLET_VERSION__
      : "unknown";
  const rlMajor = major(reactLeafletVersion);
  const reactMajor = Number(major(reactVersion));
  const expected = COMPATIBILITY[rlMajor] ?? [];

  if (expected.length === 0) {
    return {
      compatible: false,
      reactVersion,
      reactLeafletVersion,
      expectedReactMajors: expected,
      message: `react-leaflet ${reactLeafletVersion} no está en la matriz de compatibilidad conocida.`,
    };
  }

  const compatible = expected.includes(reactMajor);
  return {
    compatible,
    reactVersion,
    reactLeafletVersion,
    expectedReactMajors: expected,
    message: compatible
      ? undefined
      : `react-leaflet ${reactLeafletVersion} requiere React ${expected.join(" o ")}, pero la app usa React ${reactVersion}.`,
  };
}
