import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCheck, Package, Smartphone, Wrench, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAdminNotifications, type AdminNotifKind } from "@/hooks/useAdminNotifications";
import { useWebPush } from "@/hooks/useWebPush";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/hooks/useRelativeTime";
import { Link } from "react-router-dom";

const iconFor: Record<AdminNotifKind, typeof Package> = {
  order: Package,
  quote: FileText,
  maintenance: Wrench,
};

const tintFor: Record<AdminNotifKind, string> = {
  order: "bg-indigo-500/15 text-indigo-300",
  quote: "bg-amber-500/15 text-amber-300",
  maintenance: "bg-sky-500/15 text-sky-300",
};

export function NotificationsBell() {
  const {
    items,
    unread,
    permission,
    requestPermission,
    markAllRead,
    clear,
  } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const push = useWebPush();

  // Auto-mark on open
  useEffect(() => {
    if (open && unread > 0) {
      const id = setTimeout(() => markAllRead(), 800);
      return () => clearTimeout(id);
    }
  }, [open, unread, markAllRead]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Notificaciones"
        >
          {permission === "denied" ? (
            <BellOff className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] p-0 bg-[#0d0d10] border-white/10 text-foreground"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div>
            <p className="text-sm font-semibold">Notificaciones</p>
            <p className="text-[11px] text-muted-foreground">
              Pedidos, cotizaciones y mantenimiento en tiempo real
            </p>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={markAllRead}
                  aria-label="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={clear}
                  aria-label="Limpiar"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {permission === "default" && (
          <div className="px-4 py-3 border-b border-white/5 bg-primary/5">
            <p className="text-[12px] text-foreground mb-2">
              Activa las alertas del navegador para enterarte aunque tengas la pestaña
              en segundo plano.
            </p>
            <Button size="sm" className="h-7 text-xs" onClick={requestPermission}>
              Activar alertas
            </Button>
          </div>
        )}
        {permission === "denied" && (
          <div className="px-4 py-3 border-b border-white/5 bg-red-500/5">
            <p className="text-[12px] text-red-300">
              Las alertas del navegador están bloqueadas. Habilítalas desde la
              configuración del sitio para no perder ningún aviso.
            </p>
          </div>
        )}

        <div className="max-h-[360px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Sin notificaciones todavía
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((n) => {
                const Icon = iconFor[n.kind];
                return (
                  <li key={n.id}>
                    <Link
                      to={n.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors",
                        !n.read && "bg-primary/[0.04]",
                      )}
                    >
                      <div
                        className={cn(
                          "shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center",
                          tintFor[n.kind],
                        )}
                      >
                        <Icon className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-foreground truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 uppercase tracking-wide">
                          {formatRelative(new Date(n.at).toISOString())}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
