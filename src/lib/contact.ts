/**
 * Single source of truth for Grupo Psi contact channels.
 *
 * Change a number or address here only. Every UI surface, printed document and
 * link builder must read from these constants so a contact change never leaves
 * half the site pointing somewhere else.
 *
 * Not covered here: `index.html` (static SEO/JSON-LD) and
 * `supabase/functions/sora-chat` (Deno edge function). Both keep their own copy
 * and must be updated alongside this file.
 */

/**
 * Digits-only international format required by wa.me links.
 * No "+", no spaces, no dashes: `https://wa.me/<digits>`.
 */
export const WHATSAPP_NUMBER = "5219932151217";

/** Human-readable phone number for copy, footers and printed documents. */
export const WHATSAPP_DISPLAY = "+52 1 993 215 1217";

/** Base wa.me link with no prefilled message. */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

/** Sales email used across contact, legal and receipt surfaces. */
export const SALES_EMAIL = "ventas@grupopsi.com";

/**
 * Builds a wa.me link, optionally prefilled with a message.
 * The message is URL-encoded here so call sites never hand-encode it.
 */
export function whatsappUrl(message?: string): string {
  if (!message) return WHATSAPP_URL;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}
