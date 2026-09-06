import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-black text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <img src="/images/logo_fondo_negro.png" alt="Grupo Psi" className="h-14 w-auto" />
            </Link>
            <p className="text-base text-gray-400 leading-relaxed">
              Líderes en soluciones integrales de seguridad industrial y equipamiento certificado para la industria mexicana.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-black uppercase tracking-widest text-white mb-6">Navegación</h4>
            <ul className="space-y-4 text-base text-gray-400">
              <li><Link to="/" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Catálogo de Productos</Link></li>
              <li><Link to="/mantenimiento" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Servicios de Mantenimiento</Link></li>
              <li><Link to="/nosotros" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Nuestra Historia</Link></li>
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
                <a href="mailto:ventas@grupopsi.com" className="hover:text-primary transition-colors">
                  ventas@grupopsi.com
                </a>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-primary transition-colors">
                  Formulario de contacto
                </Link>
              </li>
              <li className="pt-2 border-t border-border/20">
                <Link to="/admin/login" className="hover:text-primary transition-colors text-xs opacity-60 hover:opacity-100">
                  Acceso administrativo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Grupo Psi. Todos los derechos reservados.</span>
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
            <Link to="/terminos" className="hover:text-primary transition-colors">Términos y Condiciones</Link>
            <Link to="/privacidad" className="hover:text-primary transition-colors">Aviso de Privacidad</Link>
            <Link to="/cambios-devoluciones" className="hover:text-primary transition-colors">Cambios y Devoluciones</Link>
            <Link to="/privacidad-global" className="hover:text-primary transition-colors">Privacidad Global</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
