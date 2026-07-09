// Mapea errores comunes de Supabase Auth a mensajes claros en español.
export function friendlyAuthError(err: { message?: string; code?: string } | null | undefined): string {
  if (!err) return "Ocurrió un error inesperado. Intenta de nuevo.";
  const msg = (err.message ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();

  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (msg.includes("email not confirmed")) {
    return "Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.";
  }
  if (msg.includes("email rate limit") || msg.includes("too many requests") || code === "over_email_send_rate_limit") {
    return "Demasiados intentos. Espera unos minutos antes de volver a intentar.";
  }
  if (msg.includes("user already registered") || code === "user_already_exists") {
    return "Ya existe una cuenta con este correo. Inicia sesión.";
  }
  if (msg.includes("password should be") || code === "weak_password") {
    return "La contraseña es demasiado débil. Usa al menos 8 caracteres, con letras y números.";
  }
  if (msg.includes("token has expired") || msg.includes("invalid token") || code === "otp_expired") {
    return "El enlace expiró o ya fue usado. Solicita uno nuevo.";
  }
  if (msg.includes("network")) {
    return "Sin conexión. Verifica tu red e intenta de nuevo.";
  }
  return err.message ?? "No fue posible completar la operación.";
}
