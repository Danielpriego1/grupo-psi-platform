import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import authHero from "@/assets/auth-hero.jpg";
import { setRememberPreference } from "@/lib/authSession";
import { friendlyAuthError } from "@/lib/authErrors";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Ingresa tu correo").email("Correo no válido").max(255),
  password: z.string().min(1, "Ingresa tu contraseña").max(72, "La contraseña es demasiado larga"),
});

type FieldErrors = Partial<Record<"email" | "password" | "form", string>>;

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const from = (location.state as { from?: string })?.from || "/portal";

  const setFieldError = (field: keyof FieldErrors, msg?: string) =>
    setErrors((prev) => ({ ...prev, [field]: msg }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      // Enfocar el primer campo con error
      const firstField = parsed.error.issues[0]?.path[0];
      if (typeof firstField === "string") {
        document.getElementById(firstField)?.focus();
      }
      return;
    }

    setLoading(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setLoading(false);
    if (error) {
      const msg = friendlyAuthError(error as { message?: string; code?: string });
      setErrors({ form: msg });
      toast.error(msg);
      return;
    }
    setRememberPreference(remember);
    toast.success("Bienvenido de nuevo");
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        aria-hidden="true"
      >
        <img
          src={authHero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          loading="lazy"
          width={1024}
          height={1536}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-primary/25" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex items-center gap-2 text-foreground">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-semibold tracking-tight">Grupo Psi</span>
        </div>

        <div className="relative space-y-8 text-foreground">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary/80 mb-3">
              Portal de clientes
            </p>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">
              Equipo confiable.
              <br />
              <span className="text-primary">Servicio certificado.</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Gestiona tus equipos, certificados y mantenimientos desde un solo lugar.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-foreground/80">
            {[
              "Certificados con validación QR",
              "Historial completo de mantenimientos",
              "Órdenes y facturas siempre a la mano",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Grupo Psi · Nacajuca, Tabasco
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-6 lg:px-10 py-5 border-b border-border/40">
          <Link to="/" className="flex items-center gap-2 lg:hidden text-sm font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Grupo Psi
          </Link>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al sitio
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-16">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight">Bienvenido de nuevo</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ingresa a tu cuenta para continuar.
              </p>
            </div>

            <OAuthButtons />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-[0.18em]">
                <span className="bg-background px-3 text-muted-foreground">o con correo</span>
              </div>
            </div>

            {errors.form && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setFieldError("email", undefined);
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={cn("h-11", errors.email && "border-destructive focus-visible:ring-destructive")}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-xs text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    ¿La olvidaste?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setFieldError("password", undefined);
                    }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={cn(
                      "h-11 pr-10",
                      errors.password && "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="text-xs text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Recordarme en este dispositivo
                </Label>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                {remember
                  ? "Mantendremos tu sesión activa por 30 días."
                  : "Cerraremos tu sesión al cerrar la pestaña o tras 12 horas."}
              </p>

              <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar sesión
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link
                to="/registro"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
