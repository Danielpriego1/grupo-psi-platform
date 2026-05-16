import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export type QrKind = "certificado" | "equipo";

export function buildQrUrl(kind: QrKind, token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/verificar/${kind}/${token}`;
}

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 192, className }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0a0a0a", light: "#ffffff" },
    }).catch((e) => setError(e.message));
  }, [value, size]);

  if (error) return <div className="text-xs text-destructive">{error}</div>;
  return <canvas ref={canvasRef} className={className} aria-label="Código QR" />;
}

export async function downloadQrPng(value: string, filename: string, size = 512) {
  const dataUrl = await QRCode.toDataURL(value, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
