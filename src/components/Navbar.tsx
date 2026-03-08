import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/logo_fondo_blanco.png" alt="Grupo PSI" className="h-10 w-auto" />
          <span className="hidden text-lg font-bold sm:inline">Grupo PSI</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Catálogo
          </Link>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
