import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Copy, RefreshCw, Home, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportAppError, getCorrelationId } from "@/lib/errorReporting";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  correlationId: string;
  message: string;
  copied: boolean;
}

/**
 * Captura errores de render en toda la app y muestra una pantalla de
 * diagnóstico con ID de correlación en vez de dejar la pantalla en blanco.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, correlationId: "", message: "", copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, message: error.message, correlationId: getCorrelationId() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error);
    void reportAppError(error, {
      kind: "render",
      detail: { componentStack: info.componentStack?.slice(0, 4000) },
    }).then((id) => this.setState({ correlationId: id }));
  }

  private handleCopy = async () => {
    const text = `ID de correlación: ${this.state.correlationId}\nRuta: ${window.location.pathname}\nError: ${this.state.message}\nFecha: ${new Date().toISOString()}`;
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      window.setTimeout(() => this.setState({ copied: false }), 2500);
    } catch {
      /* portapapeles no disponible */
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Algo falló al cargar esta página
              </h1>
              <p className="text-sm text-muted-foreground">
                El resto del sitio sigue disponible.
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              ID de correlación
            </p>
            <p className="mt-1 font-mono text-lg font-semibold text-foreground">
              {this.state.correlationId || "—"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Compártelo con soporte: con ese ID localizamos este error exacto en
              la bitácora.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Reintentar</span>
            </Button>
            <Button variant="outline" onClick={this.handleCopy}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span>{this.state.copied ? "Copiado" : "Copiar ID"}</span>
            </Button>
            <Button variant="outline" asChild>
              <a href="/diagnostico">
                <Stethoscope className="h-4 w-4" aria-hidden="true" />
                <span>Diagnóstico</span>
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="/">
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>Ir al inicio</span>
              </a>
            </Button>
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {this.state.copied ? "ID de correlación copiado" : ""}
          </p>
        </div>
      </main>
    );
  }
}

export default AppErrorBoundary;
