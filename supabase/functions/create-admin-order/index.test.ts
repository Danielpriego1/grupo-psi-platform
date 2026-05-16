import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// Mirror del regex definido en index.ts
const POSTAL_CODE_REGEX = /^\d{5}$/;

Deno.test("POSTAL_CODE_REGEX acepta exactamente 5 dígitos", () => {
  assert(POSTAL_CODE_REGEX.test("86000"));
  assert(POSTAL_CODE_REGEX.test("01000"));
});

Deno.test("POSTAL_CODE_REGEX rechaza valores inválidos", () => {
  assertFalse(POSTAL_CODE_REGEX.test(""));
  assertFalse(POSTAL_CODE_REGEX.test("1234"));
  assertFalse(POSTAL_CODE_REGEX.test("123456"));
  assertFalse(POSTAL_CODE_REGEX.test("8600A"));
  assertFalse(POSTAL_CODE_REGEX.test("86-00"));
  assertFalse(POSTAL_CODE_REGEX.test("86 00"));
  assertFalse(POSTAL_CODE_REGEX.test(" 86000"));
});

const FUNCTIONS_URL = `${Deno.env.get("VITE_SUPABASE_URL")}/functions/v1/create-admin-order`;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "";

Deno.test("endpoint rechaza solicitudes sin autorización antes de procesar", async () => {
  const res = await fetch(FUNCTIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ postal_code: "86000" }),
  });
  await res.text();
  // Sin Authorization el endpoint responde 401 (no llega a la validación de CP).
  assertEquals(res.status, 401);
});

Deno.test("endpoint responde a preflight CORS", async () => {
  const res = await fetch(FUNCTIONS_URL, { method: "OPTIONS" });
  await res.text();
  assert(res.status === 200 || res.status === 204);
  assert(res.headers.get("access-control-allow-origin") !== null);
});
