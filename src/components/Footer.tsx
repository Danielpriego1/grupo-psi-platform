import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/images/logo_fondo_negro.png" alt="Grupo Psi" className="h-10 w-auto" />
              <span className="text-lg font-bold">Grupo Psi</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Soluciones integrales en seguridad industrial y equipamiento para tu empresa.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Catálogo</Link></li>
              <li><Link to="/mantenimiento" className="hover:text-primary transition-colors">Mantenimiento</Link></li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Productos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Extintores PQS</li>
              <li>Extintores CO₂</li>
              <li>Unidades Móviles</li>
              <li>Uniformes Industriales</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://wa.me/5219931684717" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  +52 1 993 168 4717
                </a>
              </li>
              <li>
                <a href="mailto:daniel@grupopsi.com" className="hover:text-primary transition-colors">
                  daniel@grupopsi.com
                </a>
              </li>
              <li className="pt-2 border-t border-border/20">
                <Link to="/admin/login" className="hover:text-primary transition-colors text-xs opacity-60 hover:opacity-100">
                  Acceso administrativo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/30 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Grupo Psi. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
