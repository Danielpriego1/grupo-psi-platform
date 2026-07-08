import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Users,
  LogOut,
  Menu,
  X,
  Wrench,
  CalendarDays,
  FileText,
  QrCode,
  Sparkles,
  ShieldCheck,
  Target,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminNotificationsProvider } from "@/hooks/useAdminNotifications";
import { NotificationsBell } from "@/components/admin/NotificationsBell";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "CRM Ventas", icon: Target, path: "/admin/crm" },
  { label: "Calendario", icon: CalendarDays, path: "/admin/calendario" },
  { label: "Pedidos", icon: ShoppingCart, path: "/admin/orders" },
  { label: "Mantenimiento", icon: Wrench, path: "/admin/maintenance" },
  { label: "Entregas", icon: Truck, path: "/admin/deliveries" },
  { label: "Inventario", icon: Package, path: "/admin/inventory" },
  { label: "Clientes", icon: Users, path: "/admin/clients" },
  { label: "Certificados", icon: FileText, path: "/admin/certificados" },
  { label: "Equipos", icon: QrCode, path: "/admin/equipos" },
  { label: "Contenido Web", icon: Sparkles, path: "/admin/contenido" },
  { label: "Eventos de pago", icon: Receipt, path: "/admin/payment-events" },
  { label: "Auditoría Stripe", icon: ShieldCheck, path: "/admin/auditoria" },
];

export function AdminLayout() {
  const { user, signOut, roles } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentLabel =
    navItems.find((i) =>
      i.path === "/admin"
        ? location.pathname === "/admin"
        : location.pathname.startsWith(i.path),
    )?.label ?? "Admin";

  return (
    <AdminNotificationsProvider>
    <div className="admin-theme min-h-screen bg-[#09090b] text-foreground flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "admin-sidebar fixed inset-y-0 left-0 z-50 w-[78%] max-w-[280px] sm:w-64 lg:w-64 border-r border-white/5 transform transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] lg:translate-x-0 lg:static lg:inset-auto bg-[#09090b]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 h-20 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
              <span className="text-primary text-sm font-black">P</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-black tracking-tight text-foreground uppercase">Grupo PSI</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-70">Control Panel</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            <p className="px-2 pt-1 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
              General
            </p>
            {navItems.map((item) => {
              const isActive =
                item.path === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 lg:gap-3 lg:px-4 lg:py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-3 border-t border-[hsl(var(--admin-sidebar-border))]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/15 ring-1 ring-primary/25 flex items-center justify-center text-primary text-[11px] font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground truncate leading-tight">{user?.email}</p>
                <p className="text-[10px] text-muted-foreground capitalize leading-tight">{roles.join(", ") || "user"}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border h-14 px-4 lg:px-8 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-muted-foreground">Panel</span>
            <h1 className="text-[15px] font-semibold tracking-tight text-foreground">{currentLabel}</h1>
          </div>
          <div id="admin-header-actions" className="ml-auto flex items-center gap-2">
            <NotificationsBell />
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
    </AdminNotificationsProvider>
  );
}
