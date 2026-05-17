import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

type PkgManager = "bun" | "pnpm" | "yarn" | "npm";

function detectPackageManager(): PkgManager {
  // 1) Lo más fiable: variable inyectada por el propio gestor al ejecutar scripts.
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("bun")) return "bun";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("npm")) return "npm";
  // 2) Fallback: lockfile presente en el proyecto o en raíces ascendentes (monorepo).
  const has = (dir: string, f: string) => existsSync(path.join(dir, f));
  let dir = __dirname;
  while (true) {
    if (has(dir, "bun.lockb") || has(dir, "bun.lock")) return "bun";
    if (has(dir, "pnpm-lock.yaml")) return "pnpm";
    if (has(dir, "yarn.lock")) return "yarn";
    if (has(dir, "package-lock.json")) return "npm";
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "npm";
}

const COMPAT: Record<string, number[]> = {
  "3": [16, 17],
  "4": [17, 18],
  "5": [19],
};
const majorOf = (v: string) => Number(String(v).match(/^\d+/)?.[0] ?? 0);

/**
 * Resuelve `<pkg>/package.json` desde la raíz del proyecto usando el algoritmo
 * de resolución de Node. Soporta monorepos: pnpm (.pnpm), yarn workspaces y
 * npm con hoisting parcial, donde el paquete puede vivir en `../node_modules`
 * o en un store anidado y NO en `<projectRoot>/node_modules/<pkg>`.
 */
function readPkg(name: string): { version: string } {
  const req = createRequire(pathToFileURL(path.join(__dirname, "package.json")));
  let file: string;
  try {
    // Preferimos la subruta exportada para evitar problemas con `exports`.
    file = req.resolve(`${name}/package.json`);
  } catch {
    try {
      // Fallback: resolvemos el entry y subimos hasta el package.json del paquete.
      const entry = req.resolve(name);
      let dir = path.dirname(entry);
      while (dir !== path.dirname(dir)) {
        const candidate = path.join(dir, "package.json");
        if (existsSync(candidate)) {
          const pkg = JSON.parse(readFileSync(candidate, "utf8"));
          if (pkg.name === name) return pkg;
        }
        dir = path.dirname(dir);
      }
      throw new Error(`package.json no encontrado al subir desde ${entry}`);
    } catch (e) {
      throw new Error(
        `[compat-check] No se pudo resolver ${name}/package.json desde ${__dirname}: ${(e as Error).message}. Ejecuta la instalación del workspace.`,
      );
    }
  }
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new Error(
      `[compat-check] No se pudo leer ${file}: ${(e as Error).message}`,
    );
  }
}

// Lee versiones una sola vez al cargar la config, desde el `react` y
// `react-leaflet` que efectivamente verá este workspace.
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
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
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
