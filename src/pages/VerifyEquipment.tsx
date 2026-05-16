import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldX, Wrench, Calendar, FileText } from "lucide-react";
import { SERVICE_LABEL, statusBadgeClass, STATUS_LABEL, ServiceType, CertStatus } from "@/lib/certificates";

const EQUIPMENT_TYPE_LABEL: Record<string, string> = {
  scba: "SCBA / Equipo autocontenido",
  cilindro: "Cilindro de aire",
  compresor: "Compresor",
  mascara: "Máscara facial",
  otro: "Otro",
};

const STATUS_META = {
  operativo: { label: "Operativo", Icon: ShieldCheck, color: "text-emerald-500", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  mantenimiento_proximo: { label: "Mantenimiento próximo", Icon: ShieldAlert, color: "text-amber-500", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  fuera_servicio: { label: "Fuera de servicio", Icon: ShieldX, color: "text-red-500", badge: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" },
  sin_certificado: { label: "Sin certificado", Icon: ShieldAlert, color: "text-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
};

export default function VerifyEquipment() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!token) return;
    const { data: res } = await supabase.rpc("get_equipment_by_qr", { _token: token });
    setData(res ?? null);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [token]);

  // Realtime: any change in equipment/certs/appointments refetches
  useRealtimeTable({ table: "equipment", onChange: fetchData });
  useRealtimeTable({ table: "certificates", onChange: fetchData });
  useRealtimeTable({ table: "appointments", onChange: fetchData });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Verificando equipo...</div>;
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/40">
        <CardHeader className="text-center">
          <ShieldX className="w-12 h-12 mx-auto text-destructive" />
          <CardTitle className="mt-2">Equipo no encontrado</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          El código QR no corresponde a ningún equipo registrado.
        </CardContent>
      </Card>
    </div>
  );

  const meta = STATUS_META[data.status as keyof typeof STATUS_META] ?? STATUS_META.sin_certificado;
  const eq = data.equipment;

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="border-border/60">
          <CardHeader className="text-center pb-2">
            <meta.Icon className={`w-12 h-12 mx-auto ${meta.color}`} />
            <CardTitle className="mt-2 text-lg">{EQUIPMENT_TYPE_LABEL[eq.equipment_type] ?? eq.equipment_type}</CardTitle>
            <p className="text-sm text-muted-foreground">{data.client?.company_name ?? "Sin empresa"}</p>
            <div className="flex justify-center pt-2">
              <Badge variant="outline" className={`rounded-sm ${meta.badge}`}>{meta.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm pt-4 border-t border-border/60 mt-4">
            <Row label="Serie" value={eq.serial_number ?? "—"} mono />
            <Row label="Marca" value={eq.brand ?? "—"} />
            <Row label="Modelo" value={eq.model ?? "—"} />
            <Row label="Sucursal / Base" value={eq.branch_name ?? "—"} />
          </CardContent>
        </Card>

        {data.next_appointment && (
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Próximo servicio</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>{new Date(data.next_appointment.scheduled_at).toLocaleString("es-MX")}</p>
              <p className="text-xs text-muted-foreground capitalize">{data.next_appointment.appointment_type} · {data.next_appointment.status}</p>
            </CardContent>
          </Card>
        )}

        {data.last_maintenance && (
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Wrench className="w-4 h-4" /> Último mantenimiento</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>{data.last_maintenance.scheduled_date ?? "—"} {data.last_maintenance.time_slot ?? ""}</p>
              <p className="text-xs text-muted-foreground">Estatus: {data.last_maintenance.status}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Historial de certificados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(data.certificates ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Sin certificados emitidos</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {data.certificates.slice(0, 8).map((c: any) => (
                  <li key={c.folio} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/verificar/certificado/${c.qr_token}`} className="font-mono text-xs text-primary hover:underline truncate block">
                        {c.folio}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        {SERVICE_LABEL[c.service_type as ServiceType]} · {c.issued_at}
                        {c.valid_until && ` → ${c.valid_until}`}
                      </p>
                    </div>
                    <Badge variant="outline" className={`rounded-sm text-[10px] ${statusBadgeClass(c.status as CertStatus)}`}>
                      {STATUS_LABEL[c.status as CertStatus]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          Verificación oficial · Grupo PSI · Actualizada en tiempo real
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`text-right text-foreground ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
