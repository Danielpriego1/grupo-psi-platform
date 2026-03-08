import { Link } from "react-router-dom";
import { ShoppingCart, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
      {/* Top bar */}
      <div className="border-b border-border/30 bg-secondary/50">
        <div className="container mx-auto flex items-center justify-end gap-6 px-4 py-1.5 text-xs text-muted-foreground">
          <a href="tel:+525555555555" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Phone className="h-3 w-3" />
            Contáctenos
          </a>
          <a href="mailto:info@grupopsi.mx" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Mail className="h-3 w-3" />
            info@grupopsi.mx
          </a>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo_fondo_blanco.png"
            alt="Grupo PSI"
            className="h-10 w-auto"
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Catálogo
          </Link>
          <a href="#servicios" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Servicios
          </a>
          <a href="#contacto" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Contacto
          </a>
        </div>

        <Button variant="outline" size="sm" className="gap-2 border-border/50 bg-transparent hover:bg-secondary">
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Carrito</span>
        </Button>
      </div>
    </nav>
  );
}
