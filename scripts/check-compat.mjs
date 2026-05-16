#!/usr/bin/env node
/**
 * Verifica compatibilidad entre React y react-leaflet antes de dev/build.
 * Falla con código != 0 y mensaje claro si hay un mismatch.
 *
 * Matriz (react-leaflet major → React majors soportados):
 *   3.x → 16, 17
 *   4.x → 17, 18
 *   5.x → 19
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const COMPATIBILITY = {
  "3": [16, 17],
  "4": [17, 18],
  "5": [19],
};

function majorOf(version) {
  const m = String(version).match(/^\d+/);
  return m ? Number(m[0]) : 0;
}

function loadPkg(name) {
  try {
    return require(`${name}/package.json`);
  } catch {
    return null;
  }
}

function fail(message, details) {
  const red = (s) => `\x1b[31m${s}\x1b[0m`;
  const bold = (s) => `\x1b[1m${s}\x1b[0m`;
  console.error("\n" + red(bold("✗ Verificación de compatibilidad fallida")));
  console.error("  " + message);
  if (details) for (const line of details) console.error("  " + line);
  console.error(
    "\n  Guía: https://react-leaflet.js.org/docs/start-installation/\n",
  );
  process.exit(1);
}

const reactPkg = loadPkg("react");
const rlPkg = loadPkg("react-leaflet");

if (!reactPkg) fail("No se encontró 'react' en node_modules. Ejecuta `bun install`.");
if (!rlPkg) fail("No se encontró 'react-leaflet' en node_modules. Ejecuta `bun install`.");

const reactMajor = majorOf(reactPkg.version);
const rlMajor = String(majorOf(rlPkg.version));
const expected = COMPATIBILITY[rlMajor];

if (!expected) {
  fail(
    `react-leaflet ${rlPkg.version} no está en la matriz conocida (3.x, 4.x, 5.x).`,
    [
      `React instalado:        ${reactPkg.version}`,
      `react-leaflet instalado: ${rlPkg.version}`,
    ],
  );
}

if (!expected.includes(reactMajor)) {
  const suggested = reactMajor >= 19 ? "5" : reactMajor >= 17 ? "4" : "3";
  fail(
    `react-leaflet ${rlPkg.version} requiere React ${expected.map((m) => `${m}.x`).join(" o ")}, pero la app usa React ${reactPkg.version}.`,
    [
      `React instalado:        ${reactPkg.version}`,
      `react-leaflet instalado: ${rlPkg.version}`,
      `React esperado:          ${expected.map((m) => `${m}.x`).join(" o ")}`,
      "",
      `Solución sugerida: bun add react-leaflet@^${suggested}`,
    ],
  );
}

console.log(
  `\x1b[32m✓\x1b[0m Compatibilidad OK — React ${reactPkg.version} · react-leaflet ${rlPkg.version}`,
);
