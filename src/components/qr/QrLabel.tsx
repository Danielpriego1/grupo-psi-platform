import { QrCode, buildQrUrl, QrKind } from "./QrCode";

interface QrLabelProps {
  kind: QrKind;
  token: string;
  title: string;
  subtitle?: string;
  size?: number;
}

/** Etiqueta imprimible: logo + texto + QR. Pensada para grilla print. */
export function QrLabel({ kind, token, title, subtitle, size = 160 }: QrLabelProps) {
  const url = buildQrUrl(kind, token);
  return (
    <div className="border border-border/80 rounded-md p-4 flex flex-col items-center gap-2 bg-white text-black break-inside-avoid">
      <div className="flex items-center gap-1.5 self-start">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Grupo PSI</p>
      </div>
      <QrCode value={url} size={size} />
      <div className="text-center w-full">
        <p className="text-[11px] font-mono font-bold truncate">{title}</p>
        {subtitle && <p className="text-[10px] text-gray-600 truncate">{subtitle}</p>}
        <p className="text-[8px] text-gray-500 uppercase tracking-wide mt-1">
          {kind === "certificado" ? "Certificado oficial" : "Equipo registrado"}
        </p>
      </div>
    </div>
  );
}
