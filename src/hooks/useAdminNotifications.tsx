import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AdminNotifKind = "order" | "quote" | "maintenance";

export interface AdminNotif {
  id: string;
  kind: AdminNotifKind;
  title: string;
  body: string;
  href: string;
  at: number;
  read: boolean;
}

interface Ctx {
  items: AdminNotif[];
  unread: number;
  permission: NotificationPermission | "unsupported";
  requestPermission: () => Promise<void>;
  markAllRead: () => void;
  clear: () => void;
}

const AdminNotifCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "psi-admin-notifs-v1";
const MAX_ITEMS = 40;

const fmtMoney = (n: number | null | undefined) =>
  typeof n === "number" && !Number.isNaN(n)
    ? `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
    : "";

// Small WebAudio "ding" so we don't need an asset
function playChime() {
  try {
    const AC =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx: AudioContext = new AC();
    const now = ctx.currentTime;
    const notes = [880, 1320];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    /* ignore */
  }
}

function loadItems(): AdminNotif[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminNotif[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AdminNotif[]>(() => loadItems());
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );
  const mountedAtRef = useRef<number>(Date.now());

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
    } catch {
      /* ignore */
    }
  }, [items]);

  const pushNotif = useCallback(
    (n: Omit<AdminNotif, "id" | "at" | "read">) => {
      const notif: AdminNotif = {
        id: `${n.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        at: Date.now(),
        read: false,
        ...n,
      };
      setItems((prev) => [notif, ...prev].slice(0, MAX_ITEMS));

      // In-app toast
      toast(n.title, {
        description: n.body,
        action: {
          label: "Ver",
          onClick: () => {
            window.location.href = n.href;
          },
        },
      });

      // Browser notification (works even if tab is in background)
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        try {
          const bn = new Notification(n.title, {
            body: n.body,
            icon: "/favicon.png",
            badge: "/favicon.png",
            tag: n.kind,
            renotify: true,
          } as NotificationOptions);
          bn.onclick = () => {
            window.focus();
            window.location.href = n.href;
            bn.close();
          };
        } catch {
          /* ignore */
        }
      }

      playChime();
    },
    [],
  );

  // Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("admin-notifs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row: any = payload.new;
          const createdAt = row?.created_at ? new Date(row.created_at).getTime() : Date.now();
          // Ignore historic rows arriving on late resync
          if (createdAt < mountedAtRef.current - 10_000) return;
          const isQuote =
            typeof row?.order_number === "string" &&
            row.order_number.startsWith("COT-");
          const kind: AdminNotifKind = isQuote ? "quote" : "order";
          const total = fmtMoney(Number(row?.total));
          pushNotif({
            kind,
            title: isQuote
              ? `Nueva cotización · ${row?.order_number ?? ""}`
              : `Nuevo pedido · ${row?.order_number ?? ""}`,
            body: [row?.contact_name || row?.notes || "Cliente", total]
              .filter(Boolean)
              .join(" · "),
            href: "/admin/orders",
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "maintenance_requests" },
        (payload) => {
          const row: any = payload.new;
          const createdAt = row?.created_at ? new Date(row.created_at).getTime() : Date.now();
          if (createdAt < mountedAtRef.current - 10_000) return;
          pushNotif({
            kind: "maintenance",
            title: `Solicitud de mantenimiento · ${row?.folio ?? row?.tracking_code ?? ""}`,
            body: [
              row?.contact_name || "Solicitud nueva",
              row?.total_units ? `${row.total_units} equipos` : null,
              row?.municipality,
            ]
              .filter(Boolean)
              .join(" · "),
            href: "/admin/maintenance",
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pushNotif]);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
    } catch {
      /* ignore */
    }
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      unread: items.filter((n) => !n.read).length,
      permission,
      requestPermission,
      markAllRead,
      clear,
    }),
    [items, permission, requestPermission, markAllRead, clear],
  );

  return <AdminNotifCtx.Provider value={value}>{children}</AdminNotifCtx.Provider>;
}

export function useAdminNotifications() {
  const ctx = useContext(AdminNotifCtx);
  if (!ctx)
    throw new Error("useAdminNotifications must be used within AdminNotificationsProvider");
  return ctx;
}
