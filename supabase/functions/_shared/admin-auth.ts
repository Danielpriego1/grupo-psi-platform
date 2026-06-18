// Shared admin/superadmin auth helper for edge functions.
// Returns { ok: true } if the bearer token belongs to a user with one of the
// allowed roles, or { ok: false, status, error } otherwise.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AllowedRole = "admin" | "superadmin" | "vendor" | "tecnico" | "client";

export interface AdminAuthResult {
  ok: boolean;
  userId?: string;
  status?: number;
  error?: string;
}

export async function requireRole(
  req: Request,
  allowed: AllowedRole[] = ["admin", "superadmin"],
): Promise<AdminAuthResult> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, status: 401, error: "missing_token" };

  // Allow service-role calls (used by cron jobs / internal callers)
  if (SERVICE_KEY && token === SERVICE_KEY) return { ok: true, userId: "service" };

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: u, error } = await userClient.auth.getUser();
  if (error || !u.user) return { ok: false, status: 401, error: "invalid_token" };

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  for (const role of allowed) {
    const { data: has } = await admin.rpc("has_role", { _user_id: u.user.id, _role: role });
    if (has) return { ok: true, userId: u.user.id };
  }
  return { ok: false, status: 403, error: "forbidden" };
}
