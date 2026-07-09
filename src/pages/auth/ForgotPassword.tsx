import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { friendlyAuthError } from "@/lib/authErrors";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().min(1, "Ingresa tu correo").email("Correo no válido").max(255),
});

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(undefined);
    setFormError(undefined);

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message);
      document.getElementById("email")?.focus();
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(parsed.data.email);
    setLoading(false);
    if (error) {
      const msg = friendlyAuthError(error as { message?: string; code?: string });
      setFormError(msg);
      toast.error(msg);
      return;
    }
    setSent(true);
  };

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace seguro a tu correo"
      footer={
        <Link to="/login" className="font-medium text-foreground hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        <div className="text-center py-2 space-y-4" role="status" aria-live="polite">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-foreground font-medium">Revisa tu bandeja de entrada</p>
            <p className="text-sm text-muted-foreground">
              Si <span className="text-foreground font-medium">{email}</span> está registrado,
              recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
            <p className="text-xs text-muted-foreground">
              El enlace expira en 1 hora. Revisa también tu carpeta de spam.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            Usar otro correo
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
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
                if (emailError) setEmailError(undefined);
              }}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : "email-help"}
              className={cn("h-11", emailError && "border-destructive focus-visible:ring-destructive")}
            />
            {emailError ? (
              <p id="email-error" role="alert" className="text-xs text-destructive">
                {emailError}
              </p>
            ) : (
              <p id="email-help" className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Recibirás un enlace válido por 1 hora.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar enlace de recuperación
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
