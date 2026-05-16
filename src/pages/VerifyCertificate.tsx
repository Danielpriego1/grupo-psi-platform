import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { SERVICE_LABEL, STATUS_LABEL, statusBadgeClass, ServiceType, CertStatus } from "@/lib/certificates";

export default function VerifyCertificate() {
  const { token } = useParams();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCert = useCallback(async () => {
    if (!token) return;
    const { data } = await supabase.rpc("get_certificate_by_qr", { _token: token });
    setCert(Array.isArray(data) ? data[0] : data);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchCert(); }, [fetchCert]);
  useRealtimeTable({ table: "certificates", onChange: fetchCert });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Verificando...</div>;

  if (!cert) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/40">
        <CardHeader className="text-center">
          <ShieldX className="w-12 h-12 mx-auto text-destructive" />
          <CardTitle className="mt-2">Certificado no encontrado</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          El código de verificación no corresponde a ningún certificado emitido.
        </CardContent>
      </Card>
    </div>
  );

  const Icon = cert.status === "vigente" ? ShieldCheck : cert.status === "por_vencer" ? ShieldAlert : ShieldX;
  const iconColor = cert.status === "vigente" ? "text-emerald-500"
    : cert.status === "por_vencer" ? "text-amber-500"
    : cert.status === "vencido" ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full border-border/60">
        <CardHeader className="text-center pb-2">
          <Icon className={`w-12 h-12 mx-auto ${iconColor}`} />
          <CardTitle className="mt-2 text-lg">Certificado Grupo PSI</CardTitle>
          <p className="font-mono text-xs text-muted-foreground">{cert.folio}</p>
          <div className="flex justify-center pt-2">
            <Badge variant="outline" className={`rounded-sm ${statusBadgeClass(cert.status as CertStatus)}`}>
              {STATUS_LABEL[cert.status as CertStatus]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm pt-4 border-t border-border/60 mt-4">
          <Row label="Cliente" value={cert.client_company ?? "—"} />
          <Row label="Tipo de servicio" value={SERVICE_LABEL[cert.service_type as ServiceType]} />
          <Row label="Sucursal / Base" value={cert.branch_name ?? "—"} />
          <Row label="Equipo" value={
            [cert.equipment_brand, cert.equipment_model, cert.equipment_serial && `S/N ${cert.equipment_serial}`]
              .filter(Boolean).join(" · ") || "—"
          } />
          <Row label="Emisión" value={cert.issued_at} />
          <Row label="Vigencia" value={cert.valid_until ?? "Sin vencimiento"} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}
