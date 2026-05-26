import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface MaintenanceReceiptData {
  folio: string;
  createdAt: Date;
  scheduledDate: Date | null;
  timeSlot: string | null;
  contact: { name: string; phone: string; email: string };
  address: string | null;
  state: string | null;
  municipality: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  equipmentItems: Array<Record<string, any>>;
  totalUnits: number;
  additionalNotes: string | null;
  status?: string;
}

async function loadLogoDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(typeof r.result === "string" ? r.result : null);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const dt = (d: Date | null) =>
  d ? format(d, "d 'de' MMMM yyyy", { locale: es }) : "—";

const dtFull = (d: Date) => format(d, "d 'de' MMMM yyyy, HH:mm", { locale: es });

export async function downloadMaintenanceReceipt(data: MaintenanceReceiptData) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Logo
  const logo = await loadLogoDataUrl("/grupo-psi-logo.png");
  if (logo) {
    try {
      doc.addImage(logo, "PNG", margin, y, 70, 70);
    } catch {
      /* ignore */
    }
  }

  // Header text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("Grupo PSI", margin + 85, y + 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Comprobante de Solicitud de Mantenimiento", margin + 85, y + 42);
  doc.text("Nacajuca, Tabasco · +52 1 993 168 4717 · ventas@grupopsi.com", margin + 85, y + 56);

  y += 90;

  // Divider
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Folio block
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 60, 6, 6, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("FOLIO", margin + 16, y + 18);
  doc.setFont("courier", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(data.folio, margin + 16, y + 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("ESTATUS INICIAL", pageWidth - margin - 130, y + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(202, 138, 4);
  doc.text((data.status ?? "Pendiente").toUpperCase(), pageWidth - margin - 130, y + 40);

  y += 80;

  // Fechas
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Fechas", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Fecha de solicitud: ${dtFull(data.createdAt)}`, margin, y);
  y += 14;
  doc.text(
    `Fecha de recolección: ${dt(data.scheduledDate)}${data.timeSlot ? "  ·  " + data.timeSlot : ""}`,
    margin,
    y,
  );
  y += 22;

  // Cliente
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Datos del cliente", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Nombre: ${data.contact.name}`, margin, y);
  y += 14;
  doc.text(`Teléfono: ${data.contact.phone}`, margin, y);
  y += 14;
  doc.text(`Email: ${data.contact.email}`, margin, y);
  y += 22;

  // Dirección
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Dirección de recolección", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  const addrLines = [
    data.address || "—",
    `${data.municipality ?? "—"}, ${data.state ?? "—"}  ·  CP ${data.postalCode ?? "—"}`,
  ];
  if (data.latitude != null && data.longitude != null) {
    addrLines.push(`Coordenadas: ${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`);
  }
  addrLines.forEach((l) => {
    doc.text(l, margin, y, { maxWidth: pageWidth - margin * 2 });
    y += 14;
  });
  y += 8;

  // Equipos tabla
  const rows = (data.equipmentItems || []).map((it, i) => {
    const detalle = [
      it.type,
      it.weight,
      it.scbaPsi,
      it.scbaMinutes,
      it.detectorBrand,
      it.detectorGases,
    ]
      .filter(Boolean)
      .join(" · ");
    return [String(i + 1), String(it.category ?? "—"), detalle || "—", String(it.quantity ?? 1)];
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Categoría", "Detalle", "Cant."]],
    body: rows.length ? rows : [["—", "—", "Sin equipos", "0"]],
    foot: [["", "", "Total unidades", String(data.totalUnits)]],
    theme: "striped",
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    footStyles: { fillColor: [241, 245, 249], textColor: 15, fontStyle: "bold" },
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = (doc.lastAutoTable?.finalY ?? y) + 20;

  if (data.additionalNotes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Observaciones", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    const split = doc.splitTextToSize(data.additionalNotes, pageWidth - margin * 2);
    doc.text(split, margin, y);
    y += split.length * 12 + 10;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(220);
  doc.line(margin, footerY - 16, pageWidth - margin, footerY - 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Comprobante generado el ${dtFull(new Date())}. Conserva este folio para dar seguimiento: ${data.folio}`,
    margin,
    footerY,
  );

  doc.save(`Comprobante-${data.folio}.pdf`);
}
