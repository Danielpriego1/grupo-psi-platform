import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createRequire } from "node:module";

// Plugin: valida compatibilidad React ↔ react-leaflet al iniciar Vite (dev y build).
function compatCheckPlugin() {
  return {
    name: "psi-compat-check",
    enforce: "pre" as const,
    configResolved() {
      const require = createRequire(import.meta.url);
      const COMPAT: Record<string, number[]> = {
        "3": [16, 17],
        "4": [17, 18],
        "5": [19],
      };
      const major = (v: string) => Number(String(v).match(/^\d+/)?.[0] ?? 0);

      let reactPkg: { version: string };
      let rlPkg: { version: string };
      try {
        reactPkg = require("react/package.json");
        rlPkg = require("react-leaflet/package.json");
      } catch (e) {
        throw new Error(
          `[compat-check] Falta dependencia: ${(e as Error).message}. Ejecuta \`bun install\`.`,
        );
      }

      const reactMajor = major(reactPkg.version);
      const rlMajor = String(major(rlPkg.version));
      const expected = COMPAT[rlMajor];

      if (!expected) {
        throw new Error(
          `[compat-check] react-leaflet ${rlPkg.version} no está en la matriz conocida (3.x, 4.x, 5.x).`,
        );
      }

      if (!expected.includes(reactMajor)) {
        const suggested = reactMajor >= 19 ? "5" : reactMajor >= 17 ? "4" : "3";
        throw new Error(
          `\n[compat-check] react-leaflet ${rlPkg.version} requiere React ${expected
            .map((m) => `${m}.x`)
            .join(" o ")}, pero la app usa React ${reactPkg.version}.\n` +
            `  Solución: bun add react-leaflet@^${suggested}\n` +
            `  Guía: https://react-leaflet.js.org/docs/start-installation/\n`,
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    compatCheckPlugin(),
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
