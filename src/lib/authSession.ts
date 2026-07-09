// Manejo de "Recordarme" y expiración de sesión.
// - remember=true  → sesión persistente (30 días).
// - remember=false → sesión de tab: se cierra al cerrar la pestaña o tras 12h.
import { supabase } from "@/integrations/supabase/client";

const REMEMBER_KEY = "gp_auth_remember";
const EXPIRES_KEY = "gp_auth_expires_at";
const TAB_MARKER = "gp_auth_tab_marker";

const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

export function setRememberPreference(remember: boolean) {
  try {
    const expiresAt = Date.now() + (remember ? REMEMBER_TTL_MS : SESSION_TTL_MS);
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    localStorage.setItem(EXPIRES_KEY, String(expiresAt));
    if (!remember) sessionStorage.setItem(TAB_MARKER, "1");
    else sessionStorage.removeItem(TAB_MARKER);
  } catch {
    /* storage bloqueado */
  }
}

export function clearRememberPreference() {
  try {
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    sessionStorage.removeItem(TAB_MARKER);
  } catch {
    /* noop */
  }
}

/**
 * Si la sesión debe expirar (por tiempo o por cierre de pestaña sin "recordarme"),
 * cierra sesión y devuelve true.
 */
export async function enforceSessionExpiration(): Promise<boolean> {
  try {
    const remember = localStorage.getItem(REMEMBER_KEY);
    const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) ?? 0);

    // Sin preferencia registrada, no interferir (sesión previa).
    if (!remember) return false;

    const expired = expiresAt > 0 && Date.now() > expiresAt;
    const tabClosed = remember === "0" && !sessionStorage.getItem(TAB_MARKER);

    if (expired || tabClosed) {
      await supabase.auth.signOut();
      clearRememberPreference();
      return true;
    }

    // Refrescar el marcador de pestaña si la preferencia es no-recordar.
    if (remember === "0") sessionStorage.setItem(TAB_MARKER, "1");
    return false;
  } catch {
    return false;
  }
}
