import { useState } from "react";
import { Copy, Check, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LeafletCompatResult } from "@/lib/leafletCompat";

// Inyectados en build-time por vite.config.ts (define).
declare const __PKG_MANAGER__: "bun" | "pnpm" | "yarn" | "npm";

type PkgManager = "bun" | "pnpm" | "yarn" | "npm";

const PKG_MANAGER: PkgManager =
  typeof __PKG_MANAGER__ !== "undefined" ? __PKG_MANAGER__ : "npm";

function buildCommand(pm: PkgManager, pkg: string, version: string): string {
  const spec = `${pkg}@^${version}`;
  switch (pm) {
    case "bun":
      return `bun add ${spec}`;
    case "pnpm":
      return `pnpm add ${spec}`;
    case "yarn":
      return `yarn add ${spec}`;
    case "npm":
    default:
      return `npm install ${spec}`;
  }
}

interface Props {
  compat: LeafletCompatResult;
}

export function LeafletCompatAlert({ compat }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // El major y la sugerencia vienen ya calculados desde checkLeafletCompatibility(),
  // usando la versión leída en build-time desde node_modules/react/package.json.
  const suggestedRl = compat.suggestedReactLeafletMajor;
  const command = buildCommand(PKG_MANAGER, "react-leaflet", suggestedRl);
  const runtimeMismatch =
    compat.reactRuntimeVersion && compat.reactRuntimeVersion !== compat.reactVersion;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast({
        title: "Comando copiado",
        description: "Pégalo en tu terminal y ejecuta para actualizar react-leaflet.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: "No se pudo copiar",
        description: "Copia el comando manualmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm space-y-2"
    >
      <p className="font-medium text-foreground">
        Mapa deshabilitado por incompatibilidad de versiones.
      </p>
      <p className="text-xs text-muted-foreground">{compat.message}</p>

      <dl className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-2">
        <dt className="text-muted-foreground">React instalado:</dt>
        <dd className="font-mono text-foreground">{compat.reactVersion}</dd>
        <dt className="text-muted-foreground">react-leaflet instalado:</dt>
        <dd className="font-mono text-foreground">{compat.reactLeafletVersion}</dd>
        <dt className="text-muted-foreground">React esperado:</dt>
        <dd className="font-mono text-foreground">
          {compat.expectedReactMajors.map((m) => `${m}.x`).join(" o ") || "—"}
        </dd>
        <dt className="text-muted-foreground">react-leaflet sugerido:</dt>
        <dd className="font-mono text-foreground">{suggestedRl}.x</dd>
      </dl>

      <div className="pt-2 space-y-2 text-xs">
        <p className="text-foreground font-medium">
          Cómo actualizar{" "}
          <span className="text-muted-foreground font-normal">
            (detectado: <span className="font-mono">{PKG_MANAGER}</span>):
          </span>
        </p>
        <div className="flex items-stretch gap-2">
          <code className="flex-1 px-2 py-1.5 rounded bg-muted text-foreground font-mono break-all">
            {command}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium whitespace-nowrap"
            aria-label="Copiar comando"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar
              </>
            )}
          </button>
        </div>

        <p className="text-muted-foreground">
          Por seguridad, la instalación de paquetes no puede ejecutarse desde el navegador.
          Ejecuta el comando en tu entorno de desarrollo y luego recarga.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted transition-colors font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Recargar dashboard
          </button>
          <a
            href="https://react-leaflet.js.org/docs/start-installation/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted transition-colors font-medium text-foreground"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Guía oficial
          </a>
          <a
            href={`https://github.com/PaulLeCam/react-leaflet/releases/tag/v${compat.reactLeafletVersion}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted transition-colors font-medium text-foreground"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Release notes
          </a>
        </div>
      </div>
    </div>
  );
}
