// Stripe webhook integration tests.
//
// These tests POST synthetic Stripe events (signed with STRIPE_WEBHOOK_SECRET)
// to the deployed `stripe-webhook` edge function and verify the side effects
// in `orders`, `crm_opportunities` and `crm_activities`.
//
// They are the in-sandbox equivalent of `stripe trigger <event>` with the CLI:
// `Stripe.webhooks.generateTestHeaderString` produces the same signature
// header format that Stripe CLI sends.
//
// Required env vars (already present in the Lovable sandbox):
//   - SUPABASE_URL (falls back to VITE_SUPABASE_URL)
//   - SUPABASE_DB_URL          (admin connection for seed/verify/cleanup)
//   - STRIPE_WEBHOOK_SECRET    (used to sign payloads)
//   - VITE_SUPABASE_PUBLISHABLE_KEY (anon key forwarded as apikey header)
//
// Run with:  supabase test (the `supabase--test_edge_functions` tool).

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { Client as PgClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL") ?? "";
const ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  "";
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const DB_URL = Deno.env.get("SUPABASE_DB_URL") ?? "";

const ENV_READY =
  Boolean(SUPABASE_URL) && Boolean(WEBHOOK_SECRET) && Boolean(DB_URL);

const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/stripe-webhook`;

/** Build a Stripe.Event envelope around a `data.object`. */
function buildEvent(type: string, object: Record<string, unknown>) {
  return {
    id: `evt_test_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`,
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type,
    data: { object },
  };
}

/** Compute a Stripe-compatible `stripe-signature` header using WebCrypto. */
async function signPayload(payload: string, secret: string): Promise<string> {
  const ts = Math.floor(Date.now() / 1000).toString();
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(`${ts}.${payload}`));
  const hex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `t=${ts},v1=${hex}`;
}

/** POST a Stripe event to the deployed webhook, signed like Stripe CLI does. */
async function postEvent(type: string, object: Record<string, unknown>) {
  const event = buildEvent(type, object);
  const payload = JSON.stringify(event);
  const signature = await signPayload(payload, WEBHOOK_SECRET);
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
      apikey: ANON_KEY,
    },
    body: payload,
  });
  const body = await res.text();
  return { status: res.status, body, eventId: event.id };
}

async function withDb<T>(fn: (db: PgClient) => Promise<T>): Promise<T> {
  const db = new PgClient(DB_URL);
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

/** Seed an order + linked CRM opportunity. Returns ids. */
async function seedFixture() {
  const orderNumber = `SOR-TEST-${crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase()}`;
  return withDb(async (db) => {
    const order = await db.queryObject<{ id: string }>`
      INSERT INTO public.orders (order_number, status, payment_status, total)
      VALUES (${orderNumber}, 'pending', 'unpaid', 1234.56)
      RETURNING id
    `;
    const opp = await db.queryObject<{ id: string }>`
      INSERT INTO public.crm_opportunities
        (title, stage, source, source_ref, estimated_value, contact_email)
      VALUES (${"Test " + orderNumber}, 'cotizado', 'cotizacion', ${orderNumber},
              1234.56, 'test+webhook@grupopsi.com')
      RETURNING id
    `;
    return {
      orderId: order.rows[0].id,
      opportunityId: opp.rows[0].id,
      orderNumber,
    };
  });
}

async function cleanupFixture(orderNumber: string, opportunityId: string) {
  try {
    await withDb(async (db) => {
      await db.queryArray`DELETE FROM public.crm_activities WHERE opportunity_id = ${opportunityId}`;
      await db.queryArray`DELETE FROM public.crm_opportunities WHERE id = ${opportunityId}`;
      await db.queryArray`DELETE FROM public.orders WHERE order_number = ${orderNumber}`;
      await db.queryArray`DELETE FROM public.stripe_webhook_events WHERE order_number = ${orderNumber}`;
    });
  } catch (e) {
    // Best-effort: el rol del sandbox puede no tener DELETE; no enmascarar
    // fallas reales del test si el cleanup no puede ejecutarse.
    console.error("cleanup (best-effort) failed:", (e as Error).message);
  }
}

interface OrderRow {
  payment_status: string;
  status: string;
  paid_at: Date | null;
  ticket_token: string | null;
  notes: string | null;
}
interface OppRow {
  stage: string;
  won_amount: string | null;
  closed_at: Date | null;
  lost_reason: string | null;
}
interface ActivityRow {
  id: string;
  type: string;
  content: string;
  metadata: Record<string, unknown> | null;
}

async function fetchState(orderNumber: string, opportunityId: string) {
  return withDb(async (db) => {
    const order = await db.queryObject<OrderRow>`
      SELECT payment_status, status, paid_at, ticket_token, notes
      FROM public.orders WHERE order_number = ${orderNumber}
    `;
    const opp = await db.queryObject<OppRow>`
      SELECT stage, won_amount, closed_at, lost_reason
      FROM public.crm_opportunities WHERE id = ${opportunityId}
    `;
    const activities = await db.queryObject<ActivityRow>`
      SELECT id, type, content, metadata
      FROM public.crm_activities
      WHERE opportunity_id = ${opportunityId}
      ORDER BY created_at DESC
    `;
    return {
      order: order.rows[0],
      opp: opp.rows[0],
      activities: activities.rows,
    };
  });
}

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

Deno.test({
  name: "checkout.session.completed → orden pagada + CRM ganado",
  ignore: !ENV_READY,
  async fn() {
    const fx = await seedFixture();
    try {
      const session = {
        id: `cs_test_${crypto.randomUUID().slice(0, 24)}`,
        object: "checkout.session",
        amount_total: 123456,
        currency: "mxn",
        payment_intent: `pi_test_${crypto.randomUUID().slice(0, 24)}`,
        customer_details: { name: "Webhook Test", email: "test+webhook@grupopsi.com" },
        metadata: {
          order_number: fx.orderNumber,
          order_id: fx.orderId,
          opportunity_id: fx.opportunityId,
        },
      };
      const res = await postEvent("checkout.session.completed", session);
      assertEquals(res.status, 200);

      const state = await fetchState(fx.orderNumber, fx.opportunityId);
      assertEquals(state.order.payment_status, "paid");
      assertEquals(state.order.status, "confirmed");
      assert(state.order.ticket_token, "ticket_token debe estar presente");

      assertEquals(state.opp.stage, "ganado");
      assertEquals(Number(state.opp.won_amount), 1234.56);
      assert(state.opp.closed_at, "closed_at debe estar presente");

      const paidActivity = state.activities.find(
        (a) => a.type === "pago" && (a.metadata?.event_kind === "paid"),
      );
      assert(paidActivity, "debe existir actividad CRM tipo pago/paid");
    } finally {
      await cleanupFixture(fx.orderNumber, fx.opportunityId);
    }
  },
});

Deno.test({
  name: "checkout.session.expired → orden cancelada + actividad expired",
  ignore: !ENV_READY,
  async fn() {
    const fx = await seedFixture();
    try {
      const session = {
        id: `cs_test_${crypto.randomUUID().slice(0, 24)}`,
        object: "checkout.session",
        metadata: { order_number: fx.orderNumber, order_id: fx.orderId, opportunity_id: fx.opportunityId },
      };
      const res = await postEvent("checkout.session.expired", session);
      assertEquals(res.status, 200);

      const state = await fetchState(fx.orderNumber, fx.opportunityId);
      assertEquals(state.order.payment_status, "expired");
      assertEquals(state.order.status, "cancelled");

      // El stage NO debe cambiar a perdido automáticamente.
      assertEquals(state.opp.stage, "cotizado");

      const expiredActivity = state.activities.find(
        (a) => a.type === "pago" && a.metadata?.event_kind === "expired",
      );
      assert(expiredActivity, "debe existir actividad pago/expired");
    } finally {
      await cleanupFixture(fx.orderNumber, fx.opportunityId);
    }
  },
});

Deno.test({
  name: "payment_intent.payment_failed → orden failed + actividad failed",
  ignore: !ENV_READY,
  async fn() {
    const fx = await seedFixture();
    try {
      const pi = {
        id: `pi_test_${crypto.randomUUID().slice(0, 24)}`,
        object: "payment_intent",
        last_payment_error: { message: "Su tarjeta fue rechazada." },
        metadata: { order_number: fx.orderNumber, order_id: fx.orderId, opportunity_id: fx.opportunityId },
      };
      const res = await postEvent("payment_intent.payment_failed", pi);
      assertEquals(res.status, 200);

      const state = await fetchState(fx.orderNumber, fx.opportunityId);
      assertEquals(state.order.payment_status, "failed");
      assert(state.order.notes?.includes("rechazada"), "notes debe contener motivo");

      const failedActivity = state.activities.find(
        (a) => a.type === "pago" && a.metadata?.event_kind === "failed",
      );
      assert(failedActivity, "debe existir actividad pago/failed");
    } finally {
      await cleanupFixture(fx.orderNumber, fx.opportunityId);
    }
  },
});

Deno.test({
  name: "charge.refunded → orden refunded + CRM perdido",
  ignore: !ENV_READY,
  async fn() {
    const fx = await seedFixture();
    try {
      // Primero simulamos un pago confirmado para tener payment_intent en la orden.
      const paymentIntentId = `pi_test_${crypto.randomUUID().slice(0, 24)}`;
      await postEvent("checkout.session.completed", {
        id: `cs_test_${crypto.randomUUID().slice(0, 24)}`,
        object: "checkout.session",
        amount_total: 123456,
        currency: "mxn",
        payment_intent: paymentIntentId,
        metadata: { order_number: fx.orderNumber, order_id: fx.orderId, opportunity_id: fx.opportunityId },
      });

      // Ahora el reembolso.
      const charge = {
        id: `ch_test_${crypto.randomUUID().slice(0, 24)}`,
        object: "charge",
        payment_intent: paymentIntentId,
        amount_refunded: 123456,
        currency: "mxn",
        metadata: { order_number: fx.orderNumber, opportunity_id: fx.opportunityId },
      };
      const res = await postEvent("charge.refunded", charge);
      assertEquals(res.status, 200);

      const state = await fetchState(fx.orderNumber, fx.opportunityId);
      assertEquals(state.order.payment_status, "refunded");

      assertEquals(state.opp.stage, "perdido");
      assert(state.opp.lost_reason?.toLowerCase().includes("reembolso"));

      const refundActivity = state.activities.find(
        (a) => a.type === "pago" && a.metadata?.event_kind === "refunded",
      );
      assert(refundActivity, "debe existir actividad pago/refunded");
    } finally {
      await cleanupFixture(fx.orderNumber, fx.opportunityId);
    }
  },
});

Deno.test({
  name: "idempotencia: reenviar el mismo evento no duplica efectos",
  ignore: !ENV_READY,
  async fn() {
    const fx = await seedFixture();
    try {
      const session = {
        id: `cs_test_${crypto.randomUUID().slice(0, 24)}`,
        object: "checkout.session",
        amount_total: 123456,
        currency: "mxn",
        payment_intent: `pi_test_${crypto.randomUUID().slice(0, 24)}`,
        metadata: { order_number: fx.orderNumber, order_id: fx.orderId, opportunity_id: fx.opportunityId },
      };
      const event = buildEvent("checkout.session.completed", session);
      const payload = JSON.stringify(event);
      const signature = await signPayload(payload, WEBHOOK_SECRET);
      const headers = { "Content-Type": "application/json", "stripe-signature": signature, apikey: ANON_KEY };

      const first = await fetch(WEBHOOK_URL, { method: "POST", headers, body: payload });
      await first.text();
      const second = await fetch(WEBHOOK_URL, { method: "POST", headers, body: payload });
      const secondBody = await second.text();

      assertEquals(first.status, 200);
      assertEquals(second.status, 200);
      assert(secondBody.includes("duplicate"), `respuesta del 2do POST debe marcar duplicate: ${secondBody}`);

      // Solo debe existir una actividad pago/paid para esta oportunidad.
      const state = await fetchState(fx.orderNumber, fx.opportunityId);
      const paidActivities = state.activities.filter(
        (a) => a.type === "pago" && a.metadata?.event_kind === "paid",
      );
      assertEquals(paidActivities.length, 1, "no debe duplicar actividades");
    } finally {
      await cleanupFixture(fx.orderNumber, fx.opportunityId);
    }
  },
});
