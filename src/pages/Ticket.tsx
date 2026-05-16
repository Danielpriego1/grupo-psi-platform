import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, Home, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, downloadQrPng } from "@/components/qr/QrCode";
import { supabase } from "@/integrations/supabase/client";

interface TicketData {
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  paid_at: string | null;
  created_at: string;
  address: string | null;
  municipality: string | null;
  state: string | null;
}

export default function Ticket() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_order_ticket", { _token: token });
      if (error) {
        setError(error.message);
      } else if (!data || (Array.isArray(data) && data.length === 0)) {
        setError("Ticket no encontrado o pedido no pagado.");
      } else {
        setData(Array.isArray(data) ? data[0] : data);
      }
      setLoading(false);
    })();
  }, [token]);

  const qrUrl = typeof window !== "undefined" ? window.location.href : "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando ticket...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <h1 className="text-xl font-bold text-destructive">Ticket no válido</h1>
            <p className="text-muted-foreground">{error}</p>
            <Link to="/">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" /> Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paidDate = data.paid_at ? new Date(data.paid_at).toLocaleString("es-MX") : "—";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 print:p-0">
      <Card className="max-w-lg w-full border-border print:border-0 print:shadow-none">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Ticket de pedido</h1>
            <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
              Pagado
            </Badge>
          </div>

          <div className="flex justify-center bg-white rounded-xl p-4">
            <QrCode value={qrUrl} size={200} />
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Número de pedido</span>
              <span className="font-bold text-primary">{data.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total pagado</span>
              <span className="font-bold">${Number(data.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha de pago</span>
              <span>{paidDate}</span>
            </div>
            {(data.address || data.municipality) && (
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground mb-1">Dirección de entrega</p>
                <p className="text-foreground">
                  {[data.address, data.municipality, data.state].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 print:hidden">
            <Button
              variant="outline"
              onClick={() => downloadQrPng(qrUrl, `ticket-${data.order_number}`)}
            >
              <Download className="h-4 w-4 mr-2" /> QR
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
          </div>

          <Link to="/" className="block print:hidden">
            <Button variant="ghost" className="w-full" size="sm">
              <Home className="h-4 w-4 mr-2" /> Volver al inicio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
