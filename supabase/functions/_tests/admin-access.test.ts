// Smoke tests for role-restricted admin endpoints.
//
// Run: deno test --allow-net --allow-env supabase/functions/_tests/admin-access.test.ts
//
// These tests check that the role middleware rejects unauthenticated and
// non-admin callers. Full success paths exercise live Stripe and are covered
// by the existing stripe-webhook test suite + manual UI runs.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ??
  Deno.env.get("SUPABASE_URL") ??
  "";

async function post(path: string, init: { headers?: Record<string, string>; body?: unknown } = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(init.body ?? {}),
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: res.status, text, json: json as Record<string, unknown> | null };
}

Deno.test("stripe-reconcile rejects missing Authorization", async () => {
  if (!SUPABASE_URL) return;
  const res = await post("stripe-reconcile", {});
  assertEquals(res.status, 401);
  assertEquals(res.json?.error, "missing_token");
});

Deno.test("stripe-reconcile rejects invalid token", async () => {
  if (!SUPABASE_URL) return;
  const res = await post("stripe-reconcile", { headers: { Authorization: "Bearer not-a-real-jwt" } });
  assert(res.status === 401 || res.status === 403);
});

Deno.test("export-payment-events-csv rejects missing Authorization", async () => {
  if (!SUPABASE_URL) return;
  const res = await post("export-payment-events-csv", {});
  assertEquals(res.status, 401);
  assertEquals(res.json?.error, "missing_token");
});

Deno.test("export-payment-events-csv rejects invalid token", async () => {
  if (!SUPABASE_URL) return;
  const res = await post("export-payment-events-csv", { headers: { Authorization: "Bearer not-a-real-jwt" } });
  assert(res.status === 401 || res.status === 403);
});

Deno.test("export-payment-events-csv accepts service-role token (cron path)", async () => {
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  const res = await post("export-payment-events-csv", {
    headers: { Authorization: `Bearer ${SERVICE_KEY}` },
    body: {
      since: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      until: new Date().toISOString(),
      recipients: [], // do not actually email anyone in test
    },
  });
  // 200 success or 500 if storage upload fails in isolated env — accept either,
  // but must not be 401/403 (which would indicate broken auth).
  assert(res.status !== 401 && res.status !== 403, `unexpected auth failure: ${res.status} ${res.text}`);
});
