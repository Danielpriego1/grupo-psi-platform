import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label shown in the default fallback (e.g. "el mapa"). */
  label?: string;
  /** Called when the boundary catches an error. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const label = this.props.label ?? "este componente";
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-destructive/40 bg-destructive/5 text-center"
      >
        <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">
            No se pudo cargar {label}.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {this.state.error?.message ?? "Ocurrió un error inesperado."}
          </p>
        </div>
        <button
          type="button"
          onClick={this.reset}
          className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }
}
