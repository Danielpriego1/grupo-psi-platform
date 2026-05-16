import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Download, ShoppingBag, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  SERVICE_LABEL, STATUS_LABEL, statusBadgeClass, ServiceType, CertStatus,
  requestDownload, startCopyCheckout,
} from "@/lib/certificates";

export default function PortalCertificates() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [certs, setCerts] = useState<any[]>([]);
  const [copies, setCopies] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  const fetchAll = async () => {
    if (!user?.email) return;
    const { data: client } = await supabase
      .from("clients").select("id, company_name")
      .eq("email", user.email).maybeSingle();
    if (!client) { setCerts([]); return; }
    setClientId(client.id); setClientName(client.company_name);
    const { data: c } = await supabase.from("certificates")
      .select("*").eq("client_id", client.id).order("issued_at", { ascending: false });
    setCerts(c ?? []);
    if (user) {
      const { data: r } = await supabase.from("certificate_copy_requests")
        .select("*").eq("requested_by", user.id).order("created_at", { ascending: false });
      setCopies(r ?? []);
    }
  };
  useEffect(() => { if (!loading) fetchAll(); }, [user, loading]);
  useRealtimeTable({ table: "certificates", enabled: !!clientId, filter: clientId ? `client_id=eq.${clientId}` : undefined, onChange: fetchAll });
  useRealtimeTable({ table: "certificate_copy_requests", enabled: !!user, onChange: fetchAll });

  useEffect(() => {
    if (params.get("copy") === "success") toast({ title: "Pago confirmado", description: "La copia estará disponible en breve." });
    if (params.get("copy") === "cancel") toast({ title: "Pago cancelado", variant: "destructive" });
  }, [params, toast]);

  const filtered = useMemo(() => certs.filter((c) => {
    if (typeFilter !== "all" && c.service_type !== typeFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !c.folio.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [certs, search, typeFilter, statusFilter]);

  const paidCopyFor = (certId: string) =>
    copies.find((r) => r.certificate_id === certId && r.payment_status === "paid" && r.expires_at && new Date(r.expires_at) > new Date());

  const download = async (cert: any) => {
    try {
      const paid = paidCopyFor(cert.id);
      const url = await requestDownload(cert.id, paid?.download_token);
      window.open(url, "_blank");
    } catch (e: any) {
      toast({ title: "No se pudo descargar", description: e.message, variant: "destructive" });
    }
  };

  const requestCopy = async (cert: any) => {
    try { await startCopyCheckout(cert.id); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  if (!user) return (
    <div className="max-w-md mx-auto p-8 text-center space-y-4">
      <ShieldCheck className="w-10 h-10 mx-auto text-primary" />
      <h2 className="text-xl font-semibold">Inicia sesión para ver tus certificados</h2>
      <Button asChild><Link to="/admin/login">Acceder</Link></Button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Portal del cliente</p>
        <h1 className="text-2xl font-semibold">Mis certificados</h1>
        {clientName && <p className="text-sm text-muted-foreground">{clientName}</p>}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar folio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(SERVICE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Estatus" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estatus</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" /> {filtered.length} certificado{filtered.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Folio</th>
                  <th className="text-left px-4 py-2 font-medium">Tipo</th>
                  <th className="text-left px-4 py-2 font-medium">Emisión</th>
                  <th className="text-left px-4 py-2 font-medium">Vigencia</th>
                  <th className="text-left px-4 py-2 font-medium">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/40 hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(c)}>
                    <td className="px-4 py-3 font-mono text-xs">{c.folio}</td>
                    <td className="px-4 py-3">{SERVICE_LABEL[c.service_type as ServiceType]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.issued_at}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.valid_until ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`rounded-sm ${statusBadgeClass(c.status)}`}>
                        {STATUS_LABEL[c.status as CertStatus]}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No tienes certificados emitidos todavía.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-[420px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle className="font-mono text-base">{selected.folio}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <Badge variant="outline" className={`rounded-sm ${statusBadgeClass(selected.status)}`}>
                  {STATUS_LABEL[selected.status as CertStatus]}
                </Badge>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <Field label="Tipo" value={SERVICE_LABEL[selected.service_type as ServiceType]} />
                  <Field label="Sucursal" value={selected.branch_name ?? "—"} />
                  <Field label="Emisión" value={selected.issued_at} />
                  <Field label="Vigencia" value={selected.valid_until ?? "—"} />
                </div>
                {selected.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Notas</p>
                    <p className="text-xs">{selected.notes}</p>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                  <Button size="sm" onClick={() => download(selected)} disabled={!selected.pdf_url}>
                    <Download className="w-4 h-4 mr-2" /> Descargar PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => requestCopy(selected)}>
                    <ShoppingBag className="w-4 h-4 mr-2" /> Solicitar copia certificada
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    La primera emisión es gratuita. Las copias adicionales tienen costo.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="uppercase tracking-wide text-[10px] text-muted-foreground">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
