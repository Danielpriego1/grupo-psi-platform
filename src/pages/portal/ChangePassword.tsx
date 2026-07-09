import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { friendlyAuthError } from "@/lib/authErrors";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    current: z.string().min(1, "Ingresa tu contraseña actual"),
    next: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña es demasiado larga")
      .regex(/[A-Za-z]/, "Debe incluir al menos una letra")
      .regex(/[0-9]/, "Debe incluir al menos un número"),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  })
  .refine((d) => d.next !== d.current, {
    message: "La nueva contraseña debe ser distinta a la actual",
    path: ["next"],
  });

type FieldErrors = Partial<Record<"current" | "next" | "confirm" | "form", string>>;

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const label = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Excelente"][score];
  return { score, label };
}

export default function ChangePassword() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const strength = useMemo(() => scorePassword(next), [next]);
  const barColor = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-primary", "bg-accent"][strength.score];

  const clearErr = (k: keyof FieldErrors) =>
    setErrors((p) => ({ ...p, [k]: undefined, form: undefined }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = schema.safeParse({ current, next, confirm });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const first = parsed.error.issues[0]?.path[0];
      if (typeof first === "string") document.getElementById(first)?.focus();
      return;
    }

    // 1) Verificar que exista una sesión válida y vigente antes de continuar.
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setErrors({ form: "Tu sesión expiró. Vuelve a iniciar sesión para cambiar tu contraseña." });
      toast.error("Sesión expirada");
      await signOut();
      navigate("/login", { replace: true });
      return;
    }

    // 2) Confirmar que el usuario actual siga vinculado a la sesión (evita cambios cruzados).
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.email || userData.user.id !== user?.id) {
      setErrors({ form: "No pudimos verificar tu identidad. Vuelve a iniciar sesión." });
      toast.error("Verificación fallida");
      await signOut();
      navigate("/login", { replace: true });
      return;
    }

    const verifiedEmail = userData.user.email;
    setLoading(true);

    // 3) Reautenticación: verificar la contraseña actual contra el email verificado.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: verifiedEmail,
      password: parsed.data.current,
    });
    if (verifyError) {
      setLoading(false);
      const friendly = friendlyAuthError(verifyError as { message?: string; code?: string });
      const msg =
        friendly === "Correo o contraseña incorrectos."
          ? "La contraseña actual no es correcta."
          : friendly;
      setErrors({ current: msg });
      document.getElementById("current")?.focus();
      return;
    }

    // 4) Refrescar la sesión para asegurar tokens frescos antes del update sensible.
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      setLoading(false);
      setErrors({ form: "No pudimos refrescar tu sesión. Intenta de nuevo." });
      toast.error("Sesión no verificada");
      return;
    }

    // 5) Actualizar contraseña.
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.next,
    });
    setLoading(false);

    if (updateError) {
      const msg = friendlyAuthError(updateError as { message?: string; code?: string });
      setErrors({ form: msg });
      toast.error(msg);
      return;
    }

    // Notificación de seguridad al correo del usuario (no bloqueante).
    supabase.functions
      .invoke("notify-password-change", { body: {} })
      .catch((err) => console.warn("notify-password-change failed:", err));

    toast.success("Contraseña actualizada", {
      description: "Te enviamos un correo de confirmación con los detalles del cambio.",
    });
    navigate("/portal", { replace: true });
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Portal Grupo Psi
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-lg">
        <Link
          to="/portal"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al portal
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Cambiar contraseña</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirma tu contraseña actual y elige una nueva.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {errors.form && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Current password */}
            <div className="space-y-2">
              <Label htmlFor="current">Contraseña actual</Label>
              <div className="relative">
                <Input
                  id="current"
                  type={show.current ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={current}
                  onChange={(e) => {
                    setCurrent(e.target.value);
                    if (errors.current) clearErr("current");
                  }}
                  aria-invalid={!!errors.current}
                  aria-describedby={errors.current ? "current-error" : undefined}
                  className={cn(
                    "h-11 pr-10",
                    errors.current && "border-destructive focus-visible:ring-destructive",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                  aria-label={show.current ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={show.current}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
                >
                  {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.current && (
                <p id="current-error" role="alert" className="text-xs text-destructive">
                  {errors.current}
                </p>
              )}
            </div>

            {/* New password */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <Label htmlFor="next">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="next"
                  type={show.next ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={next}
                  onChange={(e) => {
                    setNext(e.target.value);
                    if (errors.next) clearErr("next");
                  }}
                  aria-invalid={!!errors.next}
                  aria-describedby="next-help next-error"
                  className={cn(
                    "h-11 pr-10",
                    errors.next && "border-destructive focus-visible:ring-destructive",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
                  aria-label={show.next ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={show.next}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
                >
                  {show.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {next && (
                <div id="next-help" className="space-y-1" aria-live="polite">
                  <div className="flex gap-1" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i < strength.score ? barColor : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Fortaleza: <span className="text-foreground">{strength.label}</span>
                  </p>
                </div>
              )}

              {errors.next && (
                <p id="next-error" role="alert" className="text-xs text-destructive">
                  {errors.next}
                </p>
              )}
            </div>

            {/* Confirm */}
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar nueva contraseña</Label>
              <Input
                id="confirm"
                type={show.confirm ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (errors.confirm) clearErr("confirm");
                }}
                aria-invalid={!!errors.confirm}
                aria-describedby={errors.confirm ? "confirm-error" : "confirm-help"}
                className={cn(
                  "h-11",
                  errors.confirm && "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.confirm ? (
                <p id="confirm-error" role="alert" className="text-xs text-destructive">
                  {errors.confirm}
                </p>
              ) : (
                confirm &&
                confirm === next && (
                  <p id="confirm-help" className="text-xs text-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Coinciden
                  </p>
                )
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 h-11" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar contraseña
              </Button>
              <Button type="button" variant="outline" asChild className="h-11">
                <Link to="/portal">Cancelar</Link>
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          ¿Olvidaste tu contraseña?{" "}
          <Link to="/forgot-password" className="text-foreground hover:underline">
            Recupérala por correo
          </Link>
        </p>
      </main>
    </div>
  );
}
