#!/usr/bin/env node
/**
 * Bloquea el merge si:
 *  1. El build de Vite emite el warning "Some chunks are larger than ... kB".
 *  2. Algún chunk clave supera su presupuesto en KB (gzip aproximado por tamaño en disco).
 *
 * Uso: node scripts/check-bundle-size.mjs
 * Requiere que `bun run build` (o `npm run build`) haya corrido antes y exista `dist/`.
 */
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const DIST = "dist";
const ASSETS = join(DIST, "assets");

// Presupuestos por prefijo de chunk (KB, tamaño en disco minificado).
// Ajusta si un vendor crece de forma justificada.
const BUDGETS = [
  { match: /^index-.*\.js$/,            maxKB: 900,  label: "entry (index)" },
  { match: /^react-vendor-.*\.js$/,     maxKB: 300,  label: "react-vendor" },
  { match: /^ui-vendor-.*\.js$/,        maxKB: 250,  label: "ui-vendor (radix)" },
  { match: /^leaflet-vendor-.*\.js$/,   maxKB: 350,  label: "leaflet-vendor" },
  { match: /^chart-vendor-.*\.js$/,     maxKB: 500,  label: "chart-vendor (recharts)" },
  { match: /^supabase-vendor-.*\.js$/,  maxKB: 400,  label: "supabase-vendor" },
];

// Umbral global: si algún chunk (no listado) rebasa esto, también falla.
const GLOBAL_MAX_KB = 1200;

function log(msg) { process.stdout.write(msg + "\n"); }
function fail(msg) { process.stderr.write("❌ " + msg + "\n"); }

// 1) Correr build capturando stdout+stderr
log("▶ Ejecutando build para inspeccionar warnings…");
let buildOutput = "";
try {
  buildOutput = execSync("npx --no-install vite build", {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
  });
} catch (e) {
  buildOutput = (e.stdout || "") + "\n" + (e.stderr || "");
  fail("El build de Vite falló:");
  process.stderr.write(buildOutput + "\n");
  process.exit(1);
}

// 2) Detectar warning de chunk size
const chunkWarning = /Some chunks are larger than\s+[\d.]+\s*kB/i.test(buildOutput);
if (chunkWarning) {
  fail("Vite emitió el warning de chunk size. Ajusta manualChunks o sube build.chunkSizeWarningLimit sólo con justificación.");
}

// 3) Comprobar presupuestos por archivo emitido
if (!existsSync(ASSETS)) {
  fail(`No existe ${ASSETS}. ¿El build produjo output?`);
  process.exit(1);
}

const files = readdirSync(ASSETS).filter((f) => f.endsWith(".js"));
const violations = [];
const report = [];

for (const file of files) {
  const sizeKB = statSync(join(ASSETS, file)).size / 1024;
  const budget = BUDGETS.find((b) => b.match.test(file));
  const limit = budget?.maxKB ?? GLOBAL_MAX_KB;
  const label = budget?.label ?? "(sin presupuesto explícito)";
  report.push({ file, sizeKB, limit, label });
  if (sizeKB > limit) {
    violations.push({ file, sizeKB, limit, label });
  }
}

// 4) Reporte legible
log("\n📦 Tamaño de chunks (KB en disco, minificado):");
for (const r of report.sort((a, b) => b.sizeKB - a.sizeKB)) {
  const flag = r.sizeKB > r.limit ? "❌" : "✅";
  log(`  ${flag} ${r.file.padEnd(50)} ${r.sizeKB.toFixed(1).padStart(8)} KB   / ${r.limit} KB  (${r.label})`);
}

if (violations.length || chunkWarning) {
  fail(`\nFalló el chequeo de bundle: ${violations.length} chunk(s) sobre presupuesto${chunkWarning ? " + warning de Vite" : ""}.`);
  process.exit(1);
}

log("\n✅ Bundle dentro de presupuesto.");
