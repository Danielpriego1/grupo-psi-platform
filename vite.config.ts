import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync, existsSync } from "node:fs";

type PkgManager = "bun" | "pnpm" | "yarn" | "npm";

function detectPackageManager(): PkgManager {
  // 1) Lo más fiable: variable inyectada por el propio gestor al ejecutar scripts.
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("bun")) return "bun";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("npm")) return "npm";
  // 2) Fallback: lockfile presente en el proyecto.
  const has = (f: string) => existsSync(path.resolve(__dirname, f));
  if (has("bun.lockb") || has("bun.lock")) return "bun";
  if (has("pnpm-lock.yaml")) return "pnpm";
  if (has("yarn.lock")) return "yarn";
  return "npm";
}

const COMPAT: Record<string, number[]> = {
  "3": [16, 17],
  "4": [17, 18],
  "5": [19],
};
const majorOf = (v: string) => Number(String(v).match(/^\d+/)?.[0] ?? 0);

function readPkg(name: string): { version: string } {
  try {
    const file = path.resolve(__dirname, "node_modules", name, "package.json");
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new Error(
      `[compat-check] No se pudo leer ${name}/package.json: ${(e as Error).message}. Ejecuta \`bun install\`.`,
    );
  }
}

// Lee versiones una sola vez al cargar la config.
const reactPkg = readPkg("react");
const rlPkg = readPkg("react-leaflet");

// Plugin: valida compatibilidad React ↔ react-leaflet al iniciar Vite (dev y build).
function compatCheckPlugin() {
  return {
    name: "psi-compat-check",
    enforce: "pre" as const,
    configResolved() {
      const reactMajor = majorOf(reactPkg.version);
      const rlMajor = String(majorOf(rlPkg.version));
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
  define: {
    __REACT_VERSION__: JSON.stringify(reactPkg.version),
    __REACT_LEAFLET_VERSION__: JSON.stringify(rlPkg.version),
    __PKG_MANAGER__: JSON.stringify(detectPackageManager()),
  },
}));
