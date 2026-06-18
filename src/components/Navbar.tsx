import { Link } from "react-router-dom";
import { ShoppingCart, Wrench, Menu, X, ChevronDown, Scale, ShieldCheck, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

const legalLinks = [
  { to: "/terminos", label: "Términos y Condiciones", icon: Scale },
  { to: "/privacidad", label: "Aviso de Privacidad", icon: ShieldCheck },
  { to: "/cambios-devoluciones", label: "Cambios y Devoluciones", icon: RefreshCw },
  { to: "/privacidad-global", label: "Privacidad Global", icon: Globe },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, setIsOpen } = useCart();

  const navLinks = [
    { to: "/", label: "Catálogo" },
    { to: "/mantenimiento", label: "Mantenimiento", icon: Wrench },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 bg-background/80 backdrop-blur-2xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
          <img
            src="/images/grupo-psi-logo.png"
            alt="Grupo Psi"
            className="h-10 sm:h-12 md:h-14 w-auto object-contain shrink-0"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all duration-300 relative group"
            >
              {link.icon && <link.icon className="h-4 w-4" />}
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}

          {/* Legal dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all duration-300">
                Legal
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {legalLinks.map((link) => (
                <DropdownMenuItem key={link.to} asChild>
                  <Link
                    to={link.to}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
          <Button variant="outline" size="icon" className="relative" onClick={() => setIsOpen(true)}>
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-scale-in">
                {totalItems}
              </span>
            )}
          </Button>
        </nav>

        {/* Mobile: cart + menu */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="icon" className="relative" onClick={() => setIsOpen(true)}>
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
          <button
            className="h-10 w-10 flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border/40 pt-3 mt-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Legal</p>
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
