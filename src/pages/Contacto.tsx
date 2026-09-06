import { useState } from "react";
import { z } from "zod";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2, "Escriba su nombre completo").max(120, "Nombre demasiado largo"),
  email: z.string().trim().email("Correo no válido").max(255),
  phone: z.string().trim().max(40, "Teléfono demasiado largo").optional(),
  company: z.string().trim().max(160, "Nombre de empresa demasiado largo").optional(),
  subject: z.string().trim().max(160, "Asunto demasiado largo").optional(),
  message: z
    .string()
    .trim()
    .min(10, "Cuéntenos un poco más (mínimo 10 caracteres)")
    .max(4000, "El mensaje es demasiado largo"),
});

type FormValues = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  subject: "",
  message: "",
};

const channels = [
  {
    icon: Phone,
    label: "Teléfono y WhatsApp",
    value: "+52 1 993 168 4717",
    href: "https://wa.me/5219931684717",
  },
  {
    icon: Mail,
    label: "Correo",
    value: "ventas@grupopsi.com",
    href: "mailto:ventas@grupopsi.com",
  },
  {
    icon: MapPin,
    label: "Sede",
    value: "Nacajuca, Tabasco, México",
  },
  {
    icon: Clock,
    label: "Atención",
    value: "Lunes a viernes de 8:00 a 18:00 h",
  },
];

export default function Contacto() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");

  const update = (field: keyof FormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus("error");
      setServerMessage("Revise los campos marcados.");
      return;
    }

    setStatus("sending");
    setServerMessage("");

    const { error } = await supabase.functions.invoke("send-contact-message", {
      body: parsed.data,
    });

    if (error) {
      setStatus("error");
      setServerMessage(
        "No pudimos enviar su mensaje en este momento. Escríbanos por WhatsApp al +52 1 993 168 4717.",
      );
      return;
    }

    setStatus("sent");
    setValues(initialValues);
  };

  const sending = status === "sending";

  return (
    <main className="relative overflow-hidden bg-black">
      <SEO
        title="Contacto | Grupo Psi · Continuidad operativa industrial"
        description="Hable con Grupo Psi: mantenimiento, certificación y continuidad operativa de equipos críticos. Escríbanos y le respondemos el mismo día hábil."
        path="/contacto"
      />

      {/* Fondo con la misma energía del Hero */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 py-24 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="vps-chip-primary mb-6 inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Respuesta el mismo día hábil
          </span>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Hablemos de la
            <br />
            <span className="text-primary glow-text">continuidad de su operación</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Cuéntenos qué equipos administra y qué necesita resolver. Un especialista revisa su
            caso y le propone el plan de mantenimiento, certificación y logística que corresponde.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Formulario */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur sm:p-8">
            <h2 className="text-2xl font-bold text-foreground">Escríbanos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Los campos con * son obligatorios.
            </p>

            {status === "sent" ? (
              <div
                role="status"
                className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-8 text-center"
              >
                <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-lg font-semibold text-foreground">Mensaje enviado</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gracias por escribirnos. Le respondemos al correo que nos compartió durante
                    el siguiente día hábil.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setStatus("idle")}>
                  Enviar otro mensaje
                </Button>
              </div>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="name"
                    label="Nombre *"
                    value={values.name}
                    onChange={update("name")}
                    error={errors.name}
                    autoComplete="name"
                  />
                  <Field
                    id="company"
                    label="Empresa"
                    value={values.company ?? ""}
                    onChange={update("company")}
                    error={errors.company}
                    autoComplete="organization"
                  />
                  <Field
                    id="email"
                    label="Correo *"
                    type="email"
                    value={values.email}
                    onChange={update("email")}
                    error={errors.email}
                    autoComplete="email"
                  />
                  <Field
                    id="phone"
                    label="Teléfono"
                    type="tel"
                    value={values.phone ?? ""}
                    onChange={update("phone")}
                    error={errors.phone}
                    autoComplete="tel"
                  />
                </div>

                <Field
                  id="subject"
                  label="Asunto"
                  value={values.subject ?? ""}
                  onChange={update("subject")}
                  error={errors.subject}
                  placeholder="Ej. Mantenimiento de 20 equipos SCBA"
                />

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje *</Label>
                  <Textarea
                    id="message"
                    rows={6}
                    value={values.message}
                    onChange={update("message")}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "message-error" : undefined}
                    placeholder="Describa sus equipos, cantidad y la fecha en que necesita el servicio."
                  />
                  {errors.message ? (
                    <p id="message-error" role="alert" className="text-sm text-destructive">
                      {errors.message}
                    </p>
                  ) : null}
                </div>

                {status === "error" && serverMessage ? (
                  <p role="alert" className="text-sm text-destructive">
                    {serverMessage}
                  </p>
                ) : null}

                <Button type="submit" size="lg" className="w-full gap-2" disabled={sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  {sending ? "Enviando…" : "Enviar mensaje"}
                </Button>
              </form>
            )}
          </div>

          {/* Canales directos */}
          <div className="space-y-4">
            {channels.map(({ icon: Icon, label, value, href }) => (
              <div
                key={label}
                className="group rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="flex items-start gap-4">
                  <span className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {label}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        className="mt-1 block font-semibold text-foreground hover:text-primary"
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="mt-1 font-semibold text-foreground">{value}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6">
              <p className="text-sm text-muted-foreground">
                ¿Urgencia operativa? Escríbanos por WhatsApp y coordinamos la recolección de sus
                equipos el mismo día.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <a
                  href="https://wa.me/5219931684717"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

interface FieldProps {
  id: keyof FormValues & string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}

function Field({ id, label, value, onChange, error, type = "text", autoComplete, placeholder }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
