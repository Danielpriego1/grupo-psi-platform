import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { friendlyAuthError } from "@/lib/authErrors";
import { cn } from "@/lib/utils";

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña es demasiado larga")
  .regex(/[A-Za-z]/, "Debe incluir al menos una letra")
  .regex(/[0-9]/, "Debe incluir al menos un número");

function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const label = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Excelente"][score];
  return { score: score as 0 | 1 | 2 | 3 | 4, label };
}

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});

  // Verificar que la sesión provenga de un enlace de recuperación válido.
  useEffect(() => {
    let sawRecovery = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        sawRecovery = true;
        setReady("ok");
      }
    });
    // Verificación inicial: si ya hay sesión y venimos con hash de recuperación
    // (Supabase la coloca al parsear el fragmento del enlace).
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const hash = window.location.hash || "";
      const looksLikeRecovery = hash.includes("type=recovery") || hash.includes("access_token=");
      if (session && (looksLikeRecovery || sawRecovery)) {
        setReady("ok");
      } else if (session) {
        // Usuario ya autenticado que llegó manualmente: permitir cambiar contraseña.
        setReady("ok");
      } else {
        // Damos un pequeño margen para que el hash se procese.
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          setReady(data.session ? "ok" : "invalid");
        }, 800);
      }
    };
    check();
    return () => sub.subscription.unsubscribe();
  }, []);

  const strength = useMemo(() => scorePassword(password), [password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const next: typeof errors = {};
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) next.password = parsed.error.issues[0]?.message;
    if (password !== confirm) next.confirm = "Las contraseñas no coinciden";
    if (Object.keys(next).length) {
      setErrors(next);
      document.getElementById(next.password ? "password" : "confirm")?.focus();
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      const msg = friendlyAuthError(error as { message?: string; code?: string });
      setErrors({ form: msg });
      toast.error(msg);
      return;
    }
    toast.success("Contraseña actualizada correctamente");
    navigate("/portal", { replace: true });
  };

  if (ready === "checking") {
    return (
      <AuthLayout title="Verificando enlace" subtitle="Un momento…">
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (ready === "invalid") {
    return (
      <AuthLayout
        title="Enlace no válido"
        subtitle="El enlace expiró o ya fue utilizado"
        footer={
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Volver a iniciar sesión
          </Link>
        }
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            Solicita un nuevo enlace de recuperación para continuar.
          </p>
          <Button asChild className="w-full">
            <Link to="/forgot-password">Solicitar nuevo enlace</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const barColor = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-primary", "bg-accent"][strength.score];

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Elige una contraseña segura para tu cuenta">
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

        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              aria-invalid={!!errors.password}
              aria-describedby="pw-help pw-error"
              className={cn(
                "h-11 pr-10",
                errors.password && "border-destructive focus-visible:ring-destructive",
              )}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={show}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Medidor de fortaleza */}
          {password && (
            <div id="pw-help" className="space-y-1" aria-live="polite">
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

          {errors.password && (
            <p id="pw-error" role="alert" className="text-xs text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
            }}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? "confirm-error" : "confirm-help"}
            className={cn("h-11", errors.confirm && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.confirm ? (
            <p id="confirm-error" role="alert" className="text-xs text-destructive">
              {errors.confirm}
            </p>
          ) : (
            confirm &&
            confirm === password && (
              <p id="confirm-help" className="text-xs text-primary flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Coinciden
              </p>
            )
          )}
        </div>

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}
