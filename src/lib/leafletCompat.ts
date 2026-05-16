import React from "react";
import reactLeafletPkg from "react-leaflet/package.json";

/**
 * Compatibility matrix between react-leaflet major versions and React major versions.
 * Source: react-leaflet release notes / peerDependencies.
 *   - v4.x → React 17, 18
 *   - v5.x → React 19
 */
const COMPATIBILITY: Record<string, number[]> = {
  "3": [16, 17],
  "4": [17, 18],
  "5": [19],
};

function major(version: string): string {
  return (version.match(/^\d+/)?.[0] ?? "0");
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
  const reactLeafletVersion = reactLeafletPkg.version;
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
