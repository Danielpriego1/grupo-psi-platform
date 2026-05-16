import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QrLabel } from "@/components/qr/QrLabel";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function AdminQrPrint() {
  const [params] = useSearchParams();
  const kind = (params.get("kind") ?? "certificado") as "certificado" | "equipo";
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (ids.length === 0) return;
      if (kind === "certificado") {
        const { data } = await supabase.from("certificates")
          .select("id, folio, qr_token, service_type, branch_name")
          .in("id", ids);
        setItems(data ?? []);
      } else {
        const { data } = await supabase.from("equipment")
          .select("id, qr_token, serial_number, brand, model, branch_name")
          .in("id", ids);
        setItems(data ?? []);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, params.get("ids")]);

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h1 className="text-xl font-semibold">Etiquetas QR ({items.length})</h1>
          <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Imprimir</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <QrLabel
              key={it.id}
              kind={kind}
              token={it.qr_token}
              title={kind === "certificado" ? it.folio : (it.serial_number ?? "Sin serie")}
              subtitle={kind === "certificado"
                ? (it.branch_name ?? it.service_type)
                : [it.brand, it.model].filter(Boolean).join(" ")}
            />
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-center text-gray-500 py-10">No hay etiquetas para imprimir.</p>
        )}
      </div>
      <style>{`@media print { @page { margin: 10mm; } .print\\:hidden { display: none !important; } }`}</style>
    </div>
  );
}
