import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { X, Send, MessageCircle, Lock, Mic, Square, Volume2, VolumeX, Eye, EyeOff, Settings as SettingsIcon, Keyboard, RotateCcw, Ghost, HelpCircle, AlertTriangle, Activity, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import {
  useFpsMonitor,
  useLongTaskMonitor,
  useRenderMetrics,
  useScrollMetrics,
} from "@/lib/perfMonitor";

interface OrderSummary {
  order_number: string;
  total: number;
  url: string;
  items: Array<{ name: string; quantity: number; unit_amount_mxn: number }>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
  order?: OrderSummary;
}

const ORDER_MARKER_RE = /<!--ORDER:(\{[\s\S]*?\})-->/;

function extractOrder(text: string): { clean: string; order: OrderSummary | null } {
  const m = text.match(ORDER_MARKER_RE);
  if (!m) return { clean: text, order: null };
  try {
    const order = JSON.parse(m[1]) as OrderSummary;
    return { clean: text.replace(ORDER_MARKER_RE, "").trim(), order };
  } catch {
    return { clean: text.replace(ORDER_MARKER_RE, "").trim(), order: null };
  }
}

const fmtMXN = (n: number) =>
  n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "¡Hola! 👋 Soy Sora, Ejecutiva de Grupo PSI. ¿En qué te puedo ayudar hoy?",
  },
];

const WHATSAPP_NUMBER = "5219931684717";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const MAX_RENDERED_MESSAGES = 60; // virtualize tail; older still kept for context
const NEAR_BOTTOM_PX = 80;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // 1) negritas, 2) links markdown [txt](url), 3) urls sueltas
  const tokens = text.split(/(\*\*.*?\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g);
  return tokens.map((tok, i) => {
    if (!tok) return null;
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return <strong key={`${keyPrefix}-b${i}`}>{tok.slice(2, -2)}</strong>;
    }
    const md = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (md) {
      return (
        <a
          key={`${keyPrefix}-l${i}`}
          href={md[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 my-1 rounded-full bg-[#ea580c] text-white font-semibold no-underline hover:bg-[#c2410c] transition"
        >
          {md[1]} →
        </a>
      );
    }
    if (/^https?:\/\//.test(tok)) {
      return (
        <a key={`${keyPrefix}-u${i}`} href={tok} target="_blank" rel="noopener noreferrer" className="underline text-[#ffb380] break-all">
          {tok}
        </a>
      );
    }
    return <span key={`${keyPrefix}-t${i}`}>{tok}</span>;
  });
}

function renderMarkdown(text: string) {
  const out: React.ReactNode[] = [];
  const lines = text.split("\n");
  lines.forEach((line, li) => {
    if (li > 0) out.push(<br key={`br-${li}`} />);
    if (line) out.push(...renderInline(line, `l${li}`));
  });
  return out;
}

function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <div className="mt-3 rounded-2xl border border-white/15 bg-black/30 backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
          Resumen de tu pedido
        </span>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#ea580c]/20 text-[#ffb380] border border-[#ea580c]/40">
          {order.order_number}
        </span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        {order.items.map((it, idx) => (
          <div key={idx} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-white/90">
              <span className="font-semibold text-white">{it.quantity}×</span> {it.name}
            </span>
            <span className="text-white/80 tabular-nums whitespace-nowrap">
              ${fmtMXN(it.unit_amount_mxn * it.quantity)}
            </span>
          </div>
        ))}
        <div className="border-t border-white/10 mt-2 pt-2 flex items-baseline justify-between">
          <span className="text-sm text-white/70">Total (IVA incluido)</span>
          <span className="text-lg font-bold text-white tabular-nums">
            ${fmtMXN(order.total)} <span className="text-xs text-white/60">MXN</span>
          </span>
        </div>
      </div>
      <a
        href={order.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-[#ea580c] hover:bg-[#c2410c] active:bg-[#9a3412] text-white font-bold text-sm transition-colors no-underline"
      >
        <Lock className="w-4 h-4" />
        Pagar ahora con tarjeta — ${fmtMXN(order.total)} MXN
      </a>
      <div className="px-4 py-1.5 text-[10px] text-center text-white/50 bg-white/5">
        Pago seguro procesado por Stripe
      </div>
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({ msg }: { msg: Message }) {
  const content = useMemo(() => renderMarkdown(msg.content), [msg.content]);
  return (
    <div className={cn("flex w-full mb-4", msg.role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-[1.5rem] px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all duration-300",
          msg.role === "user"
            ? "bg-gradient-to-br from-[#ea580c] to-[#c2410c] text-white rounded-br-none shadow-[#ea580c]/20"
            : "bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-bl-none"
        )}
      >
        <div className="prose prose-invert max-w-none">
          {content}
        </div>
        {msg.isTyping && (
          <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-1 align-text-bottom rounded-full" />
        )}
        {msg.order && !msg.isTyping && <OrderCard order={msg.order} />}
      </div>
    </div>
  );
});

type Corner = "br" | "bl" | "tr" | "tl";

// ───── Atajos de teclado personalizables ─────
type Shortcut = { ctrl: boolean; shift: boolean; alt: boolean; key: string };
type ShortcutMap = {
  toggleOpen: Shortcut;
  toggleVoice: Shortcut;
  toggleGhost: Shortcut;
};
const DEFAULT_SHORTCUTS: ShortcutMap = {
  toggleOpen: { ctrl: true, shift: false, alt: false, key: "j" },
  toggleVoice: { ctrl: true, shift: true, alt: false, key: "v" },
  toggleGhost: { ctrl: true, shift: true, alt: false, key: "h" },
};
const SHORTCUTS_STORAGE_KEY = "soraShortcuts";

function loadShortcuts(): ShortcutMap {
  if (typeof window === "undefined") return DEFAULT_SHORTCUTS;
  try {
    const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!raw) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(raw) as Partial<ShortcutMap>;
    return {
      toggleOpen: { ...DEFAULT_SHORTCUTS.toggleOpen, ...(parsed.toggleOpen ?? {}) },
      toggleVoice: { ...DEFAULT_SHORTCUTS.toggleVoice, ...(parsed.toggleVoice ?? {}) },
      toggleGhost: { ...DEFAULT_SHORTCUTS.toggleGhost, ...(parsed.toggleGhost ?? {}) },
    };
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

function formatShortcut(s: Shortcut): string {
  const parts: string[] = [];
  if (s.ctrl) parts.push(isMac() ? "⌘" : "Ctrl");
  if (s.alt) parts.push(isMac() ? "⌥" : "Alt");
  if (s.shift) parts.push(isMac() ? "⇧" : "Shift");
  parts.push(s.key.length === 1 ? s.key.toUpperCase() : s.key);
  return parts.join(isMac() ? "" : "+");
}

function matchShortcut(e: KeyboardEvent, s: Shortcut): boolean {
  const mod = e.ctrlKey || e.metaKey;
  return (
    mod === s.ctrl &&
    e.shiftKey === s.shift &&
    e.altKey === s.alt &&
    e.key.toLowerCase() === s.key.toLowerCase()
  );
}

// ───── Validación de atajos (duplicados / reservados) ─────
const RESERVED_SHORTCUTS: ReadonlyArray<Shortcut> = [
  { ctrl: true, shift: false, alt: false, key: "c" },
  { ctrl: true, shift: false, alt: false, key: "v" },
  { ctrl: true, shift: false, alt: false, key: "x" },
  { ctrl: true, shift: false, alt: false, key: "a" },
  { ctrl: true, shift: false, alt: false, key: "z" },
  { ctrl: true, shift: false, alt: false, key: "s" },
  { ctrl: true, shift: false, alt: false, key: "p" },
  { ctrl: true, shift: false, alt: false, key: "r" },
  { ctrl: true, shift: false, alt: false, key: "t" },
  { ctrl: true, shift: false, alt: false, key: "w" },
  { ctrl: true, shift: false, alt: false, key: "n" },
  { ctrl: true, shift: false, alt: false, key: "f" },
  { ctrl: true, shift: false, alt: false, key: "l" },
  { ctrl: true, shift: true, alt: false, key: "i" },
  { ctrl: true, shift: true, alt: false, key: "j" },
];
const ACTION_LABELS: Record<keyof ShortcutMap, string> = {
  toggleOpen: "abrir/cerrar el chat",
  toggleVoice: "voz de Sora",
  toggleGhost: "modo fantasma",
};
function sameShortcut(a: Shortcut, b: Shortcut): boolean {
  return a.ctrl === b.ctrl && a.shift === b.shift && a.alt === b.alt && a.key.toLowerCase() === b.key.toLowerCase();
}
function validateShortcut(action: keyof ShortcutMap, s: Shortcut, current: ShortcutMap): string | null {
  if (!s.ctrl && !s.alt) {
    return "Incluye Ctrl/⌘ o Alt para evitar conflictos con la escritura normal.";
  }
  if (RESERVED_SHORTCUTS.some((r) => sameShortcut(r, s))) {
    return `Combinación reservada por el navegador (${formatShortcut(s)}). Elige otra.`;
  }
  for (const k of Object.keys(current) as (keyof ShortcutMap)[]) {
    if (k !== action && sameShortcut(current[k], s)) {
      return `Esa combinación ya está asignada a "${ACTION_LABELS[k]}".`;
    }
  }
  return null;
}

// ───── Cross-tab sync ─────
const HELP_STORAGE_KEY = "soraHelpDismissed";
const PROXIMITY_STORAGE_KEY = "soraProximityRadius";
const PROXIMITY_MIN = 60;
const PROXIMITY_MAX = 320;
const PROXIMITY_DEFAULT = 140;
type SyncMessage =
  | { type: "open"; value: boolean }
  | { type: "ghost"; value: boolean }
  | { type: "voice"; value: boolean }
  | { type: "corner"; value: Corner }
  | { type: "shortcuts"; value: ShortcutMap }
  | { type: "help"; value: boolean }
  | { type: "radius"; value: number };

// ───── Ghost mode: última acción / dev sync log ─────
type GhostTrigger = "scroll" | "proximity-out" | "proximity-in" | "manual-on" | "manual-off" | "shortcut";
const GHOST_TRIGGER_LABEL: Record<GhostTrigger, string> = {
  scroll: "Se ocultó por scroll",
  "proximity-out": "Se ocultó porque el cursor se alejó",
  "proximity-in": "Reapareció por proximidad del cursor",
  "manual-on": "Modo fantasma activado manualmente",
  "manual-off": "Modo fantasma desactivado manualmente",
  shortcut: "Alternado por atajo de teclado",
};
type SyncLogEntry = { id: number; source: "broadcast" | "storage"; type: string; at: number };
const IS_DEV = typeof import.meta !== "undefined" && !!(import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;






export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputHeight, setInputHeight] = useState(56); // base height in px
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stickToBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessageCountRef = useRef(messages.length);

  // Positioning & dim-on-scroll so Sora no estorba
  const [corner, setCorner] = useState<Corner>(() => {
    if (typeof window === "undefined") return "br";
    return (localStorage.getItem("soraCorner") as Corner) || "br";
  });
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ id: number; moved: boolean; longPress: ReturnType<typeof setTimeout> | null }>({ id: -1, moved: false, longPress: null });
  const [dim, setDim] = useState(false);
  const dimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ghost mode: hide launcher/panel automáticamente al leer o hacer scroll, reaparece al acercar el cursor
  const [ghostMode, setGhostMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("soraGhost") === "1";
  });
  const [hidden, setHidden] = useState(false); // true cuando ghost mode lo oculta
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ajustes (atajos personalizables)
  const [showSettings, setShowSettings] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(() => loadShortcuts());
  const [capturingAction, setCapturingAction] = useState<keyof ShortcutMap | null>(null);
  const [shortcutError, setShortcutError] = useState<{ action: keyof ShortcutMap; message: string } | null>(null);
  const [proximityHint, setProximityHint] = useState(false); // flash al ocultarse en modo fantasma
  const [helpDismissed, setHelpDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(HELP_STORAGE_KEY) === "1";
  });
  const [proximityRadius, setProximityRadius] = useState<number>(() => {
    if (typeof window === "undefined") return PROXIMITY_DEFAULT;
    const raw = localStorage.getItem(PROXIMITY_STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : PROXIMITY_DEFAULT;
    if (Number.isNaN(n)) return PROXIMITY_DEFAULT;
    return Math.min(PROXIMITY_MAX, Math.max(PROXIMITY_MIN, n));
  });
  const [lastGhostAction, setLastGhostAction] = useState<{ trigger: GhostTrigger; at: number } | null>(null);
  const [ghostAnnouncement, setGhostAnnouncement] = useState<string>("");
  const [radiusAnnouncement, setRadiusAnnouncement] = useState<string>("");
  const radiusAnnounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [radiusPreview, setRadiusPreview] = useState(false);
  const radiusPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [radiusBoundaryHit, setRadiusBoundaryHit] = useState<"min" | "max" | null>(null);
  const boundaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [radiusTooltipOpen, setRadiusTooltipOpen] = useState<boolean | undefined>(undefined);
  const tooltipAutoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileRadiusSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteRadiusApplyRef = useRef(false);
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const [showSyncLog, setShowSyncLog] = useState(true);
  const syncLogIdRef = useRef(0);
  const pushSyncLog = useCallback((source: SyncLogEntry["source"], type: string) => {
    if (!IS_DEV) return;
    syncLogIdRef.current += 1;
    const entry: SyncLogEntry = { id: syncLogIdRef.current, source, type, at: Date.now() };
    setSyncLog(prev => [...prev.slice(-9), entry]);
  }, []);

  // Announce ghost trigger changes to assistive tech
  useEffect(() => {
    if (!lastGhostAction) return;
    const time = new Date(lastGhostAction.at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    setGhostAnnouncement(`${GHOST_TRIGGER_LABEL[lastGhostAction.trigger]}. ${time}.`);
  }, [lastGhostAction]);

  // Flash the proximity circle briefly whenever the radius changes
  useEffect(() => {
    setRadiusPreview(true);
    if (radiusPreviewTimerRef.current) clearTimeout(radiusPreviewTimerRef.current);
    radiusPreviewTimerRef.current = setTimeout(() => setRadiusPreview(false), 1400);
    return () => { if (radiusPreviewTimerRef.current) clearTimeout(radiusPreviewTimerRef.current); };
  }, [proximityRadius]);

  // Debounced live announcement for radius changes (screen readers)
  useEffect(() => {
    if (radiusAnnounceTimerRef.current) clearTimeout(radiusAnnounceTimerRef.current);
    radiusAnnounceTimerRef.current = setTimeout(() => {
      setRadiusAnnouncement(`Radio de proximidad actualizado a ${proximityRadius} píxeles.`);
    }, 600);
    return () => { if (radiusAnnounceTimerRef.current) clearTimeout(radiusAnnounceTimerRef.current); };
  }, [proximityRadius]);


  // Cross-tab sync (BroadcastChannel with storage-event fallback)
  const bcRef = useRef<BroadcastChannel | null>(null);
  const suppressBroadcastRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel("sora-widget");
    bcRef.current = bc;
    bc.onmessage = (ev: MessageEvent<SyncMessage>) => {
      const m = ev.data;
      if (!m || typeof m !== "object") return;
      suppressBroadcastRef.current = true;
      try {
        if (m.type === "open") setOpen(m.value);
        else if (m.type === "ghost") setGhostMode(m.value);
        else if (m.type === "voice") setVoiceEnabled(m.value);
        else if (m.type === "corner") setCorner(m.value);
        else if (m.type === "shortcuts") setShortcuts(m.value);
        else if (m.type === "help") setHelpDismissed(m.value);
        else if (m.type === "radius") setProximityRadius(m.value);
        pushSyncLog("broadcast", m.type);
      } finally {
        // Release on next tick so state effects don't re-broadcast
        setTimeout(() => { suppressBroadcastRef.current = false; }, 0);
      }
    };
    return () => { bc.close(); bcRef.current = null; };
  }, [pushSyncLog]);

  const broadcast = useCallback((msg: SyncMessage) => {
    if (suppressBroadcastRef.current) return;
    bcRef.current?.postMessage(msg);
  }, []);

  // Storage-event fallback (other tabs writing to localStorage)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.newValue == null) return;
      suppressBroadcastRef.current = true;
      try {
        if (e.key === SHORTCUTS_STORAGE_KEY) { setShortcuts(loadShortcuts()); pushSyncLog("storage", "shortcuts"); }
        else if (e.key === "soraGhost") { setGhostMode(e.newValue === "1"); pushSyncLog("storage", "ghost"); }
        else if (e.key === "soraVoice") { setVoiceEnabled(e.newValue === "1"); pushSyncLog("storage", "voice"); }
        else if (e.key === "soraCorner") { setCorner(e.newValue as Corner); pushSyncLog("storage", "corner"); }
        else if (e.key === HELP_STORAGE_KEY) { setHelpDismissed(e.newValue === "1"); pushSyncLog("storage", "help"); }
        else if (e.key === PROXIMITY_STORAGE_KEY) {
          const n = parseInt(e.newValue, 10);
          if (!Number.isNaN(n)) setProximityRadius(Math.min(PROXIMITY_MAX, Math.max(PROXIMITY_MIN, n)));
          pushSyncLog("storage", "radius");
        }
      } finally {
        setTimeout(() => { suppressBroadcastRef.current = false; }, 0);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pushSyncLog]);


  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
    }
    broadcast({ type: "shortcuts", value: shortcuts });
  }, [shortcuts, broadcast]);

  useEffect(() => { broadcast({ type: "open", value: open }); }, [open, broadcast]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(HELP_STORAGE_KEY, helpDismissed ? "1" : "0");
    }
    broadcast({ type: "help", value: helpDismissed });
  }, [helpDismissed, broadcast]);


  // Pequeño "flash" al entrar en estado oculto, para que sepas dónde reaparecerá
  useEffect(() => {
    if (!ghostMode || !hidden) return;
    setProximityHint(true);
    const t = setTimeout(() => setProximityHint(false), 2200);
    return () => clearTimeout(t);
  }, [ghostMode, hidden]);

  useEffect(() => {
    localStorage.setItem("soraCorner", corner);
    broadcast({ type: "corner", value: corner });
  }, [corner, broadcast]);

  useEffect(() => {
    localStorage.setItem("soraGhost", ghostMode ? "1" : "0");
    if (!ghostMode) setHidden(false);
    broadcast({ type: "ghost", value: ghostMode });
  }, [ghostMode, broadcast]);

  // Persist + broadcast proximity radius
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PROXIMITY_STORAGE_KEY, String(proximityRadius));
    }
    broadcast({ type: "radius", value: proximityRadius });
  }, [proximityRadius, broadcast]);

  // Helper: mark boundary hit (visual + ARIA)
  const triggerBoundaryHit = useCallback((bound: "min" | "max") => {
    setRadiusBoundaryHit(bound);
    if (boundaryTimerRef.current) clearTimeout(boundaryTimerRef.current);
    boundaryTimerRef.current = setTimeout(() => setRadiusBoundaryHit(null), 1400);
  }, []);

  // Persist radius on the user profile (cross-device) + reconcile on visibility/online
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let userId: string | null = null;

    const applyRemote = (val: unknown) => {
      const n = typeof val === "number" ? val : parseInt(String(val ?? ""), 10);
      if (!Number.isFinite(n)) return;
      const clamped = Math.min(PROXIMITY_MAX, Math.max(PROXIMITY_MIN, Math.round(n)));
      remoteRadiusApplyRef.current = true;
      setProximityRadius(clamped);
      setTimeout(() => { remoteRadiusApplyRef.current = false; }, 0);
    };

    const loadProfile = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("sora_proximity_radius" as never)
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      const remote = (data as { sora_proximity_radius?: number | null } | null)?.sora_proximity_radius;
      if (remote != null) applyRemote(remote);
    };

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      userId = user.id;
      await loadProfile();
      channel = supabase
        .channel(`sora-profile-${user.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const remote = (payload.new as { sora_proximity_radius?: number | null } | null)?.sora_proximity_radius;
            if (remote != null) applyRemote(remote);
          },
        )
        .subscribe();
    };

    void setup();

    const onVis = () => { if (document.visibilityState === "visible") void loadProfile(); };
    const onOnline = () => { void loadProfile(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Debounced save of radius to the profile (only when local change, not remote-applied)
  useEffect(() => {
    if (remoteRadiusApplyRef.current) return;
    if (profileRadiusSaveRef.current) clearTimeout(profileRadiusSaveRef.current);
    profileRadiusSaveRef.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ sora_proximity_radius: proximityRadius } as never)
        .eq("user_id", user.id);
    }, 800);
    return () => { if (profileRadiusSaveRef.current) clearTimeout(profileRadiusSaveRef.current); };
  }, [proximityRadius]);

  // Re-broadcast state to sibling tabs when coming back online / becoming visible
  useEffect(() => {
    const rebroadcast = () => {
      broadcast({ type: "radius", value: proximityRadius });
      broadcast({ type: "ghost", value: ghostMode });
    };
    window.addEventListener("online", rebroadcast);
    const onVis = () => { if (document.visibilityState === "visible") rebroadcast(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("online", rebroadcast);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [proximityRadius, ghostMode, broadcast]);




  // Auto-fade / auto-hide while user is scrolling the page
  useEffect(() => {
    const onScroll = () => {
      if (open && !ghostMode) return;
      setDim(true);
      if (ghostMode && !isDragging) {
        setHidden(prev => {
          if (!prev) setLastGhostAction({ trigger: "scroll", at: Date.now() });
          return true;
        });
      }
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
      dimTimerRef.current = setTimeout(() => setDim(false), 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
    };
  }, [open, ghostMode, isDragging]);

  // Ghost mode: wake when cursor approaches the corner where Sora lives
  useEffect(() => {
    if (!ghostMode) return;
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const targetX = corner.endsWith("r") ? w - 48 : 48;
      const targetY = corner.startsWith("b") ? h - 48 : 48;
      const dx = e.clientX - targetX;
      const dy = e.clientY - targetY;
      const near = Math.hypot(dx, dy) < proximityRadius;
      if (near) {
        setHidden(prev => {
          if (prev) setLastGhostAction({ trigger: "proximity-in", at: Date.now() });
          return false;
        });
        if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
      } else if (!open) {
        if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
        wakeTimerRef.current = setTimeout(() => {
          setHidden(prev => {
            if (!prev) setLastGhostAction({ trigger: "proximity-out", at: Date.now() });
            return true;
          });
        }, 1400);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
    };
  }, [ghostMode, corner, open, proximityRadius]);


  const cornerClass = (c: Corner) => {
    switch (c) {
      case "br": return "bottom-6 right-6";
      case "bl": return "bottom-6 left-6";
      case "tr": return "top-6 right-6";
      case "tl": return "top-6 left-6";
    }
  };
  const panelCornerClass = (c: Corner) => {
    const v = c.startsWith("b") ? "bottom-4 sm:bottom-6" : "top-4 sm:top-6";
    const h = c.endsWith("r") ? "right-4 sm:right-6" : "left-4 sm:left-6";
    return `${v} ${h}`;
  };

  // Voice I/O
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("soraVoice") === "1";
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recStreamRef = useRef<MediaStream | null>(null);
  const recStartRef = useRef<number>(0);
  const lastSpokenRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("soraVoice", voiceEnabled ? "1" : "0");
    }
    if (!voiceEnabled && typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
    broadcast({ type: "voice", value: voiceEnabled });
  }, [voiceEnabled, broadcast]);


  const speak = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const clean = text
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[•·]/g, "")
      .trim();
    if (!clean || clean === lastSpokenRef.current) return;
    lastSpokenRef.current = clean;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "es-MX";
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => /es[-_]MX/i.test(v.lang)) || voices.find(v => /^es/i.test(v.lang));
    if (v) u.voice = v;
    u.rate = 1.05;
    u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  }, [voiceEnabled]);


  // Performance instrumentation (dev or localStorage.chatPerf="1")
  useRenderMetrics("ChatWidget", { messageCount: messages.length });
  useScrollMetrics(scrollRef, "transcript");
  useFpsMonitor(open && (isLoading || messages.some(m => m.isTyping)), "transcript");
  useLongTaskMonitor("ChatWidget");

  // Track if user scrolled away from bottom — only auto-scroll when near bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    stickToBottomRef.current = near;
    setAtBottom(prev => (prev !== near ? near : prev));
    if (near) setUnreadCount(0);
  }, []);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const jumpToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = true;
    setAtBottom(true);
    setUnreadCount(0);
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  // Scroll on new messages / loading indicator changes (smooth) + unread counter
  useEffect(() => {
    const delta = messages.length - prevMessageCountRef.current;
    if (delta > 0 && !stickToBottomRef.current) {
      // New assistant/user message arrived while user is reading above
      const newCount = messages.slice(-delta).filter(m => m.role === "assistant").length;
      if (newCount > 0) setUnreadCount(c => c + newCount);
    }
    prevMessageCountRef.current = messages.length;
    scrollToBottom(true);
  }, [messages.length, isLoading, scrollToBottom, messages]);

  // Typing effect — uses rAF batching + instant (non-smooth) scroll to avoid jank
   const typeMessage = useCallback((fullText: string, messageId: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    let charIndex = 0;
    const tick = () => {
      charIndex += 2 + Math.floor(Math.random() * 3);
      const done = charIndex >= fullText.length;
      if (done) charIndex = fullText.length;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (!last || last.id !== messageId) return prev;
        const updated = { ...last, content: fullText.slice(0, charIndex), isTyping: !done };
        return [...prev.slice(0, -1), updated];
      });
      // instant scroll during streaming — cheaper than smooth
      const el = scrollRef.current;
      if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight;
      if (!done) {
        typingTimeoutRef.current = setTimeout(tick, 18 + Math.random() * 12);
      } else {
        typingTimeoutRef.current = null;
        speak(fullText);
      }
    };
    typingTimeoutRef.current = setTimeout(tick, 18);
  }, [speak]);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = 160; // max ~5-6 lines
    const target = Math.min(el.scrollHeight, maxH);
    el.style.height = target + "px";
    setInputHeight(target);
  }, []);

  const sendText = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    stickToBottomRef.current = true;
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setInputHeight(56);
    if (inputRef.current) inputRef.current.style.height = "56px";
    requestAnimationFrame(() => inputRef.current?.focus());

    try {
      const historyForApi = updatedMessages
        .filter(m => m.id !== "welcome")
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content.replace(ORDER_MARKER_RE, "").trim() }));

      const { data, error } = await supabase.functions.invoke("sora-chat", {
        body: { messages: historyForApi },
      });

      if (error) throw error;

      const rawReply = data?.reply || "Disculpa, no pude procesar tu solicitud. ¿Podrías intentar de nuevo?";
      const { clean, order } = extractOrder(rawReply);
      const msgId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev,
        { id: msgId, role: "assistant", content: "", isTyping: true, order: order ?? undefined },
      ]);
      setIsLoading(false);
      typeMessage(clean, msgId);
    } catch (err) {
      console.error("Sora chat error:", err);
      const msgId = (Date.now() + 1).toString();
      const fallback = "Intenta de nuevo en un momento.";
      setMessages(prev => [
        ...prev,
        { id: msgId, role: "assistant", content: "", isTyping: true },
      ]);
      setIsLoading(false);
      typeMessage(fallback, msgId);
    } finally {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [messages, isLoading, typeMessage]);

  const handleSend = () => { sendText(input); };

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || isTranscribing || isLoading) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      alert("Tu navegador no soporta grabación de audio.");
      return;
    }
    // Auto-enable voice replies the first time the mic is used
    if (!voiceEnabled) setVoiceEnabled(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recStreamRef.current = stream;
      const preferred = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find(t => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t));
      const mr = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      recStartRef.current = Date.now();
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        setIsRecording(false);
        recStreamRef.current?.getTracks().forEach(t => t.stop());
        recStreamRef.current = null;
        const duration = Date.now() - recStartRef.current;
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        if (duration < 500 || blob.size < 2048) return;
        setIsTranscribing(true);
        try {
          const b64: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1] || "");
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
          const { data, error } = await supabase.functions.invoke("sora-transcribe", {
            body: { audio: b64, mime: mr.mimeType || "audio/webm" },
          });
          if (error) throw error;
          const transcript = (data?.text || "").trim();
          setIsTranscribing(false);
          if (transcript) {
            // Populate the input so the user can review/edit before sending.
            setInput((prev) => {
              const merged = prev.trim() ? `${prev.trim()} ${transcript}` : transcript;
              return merged;
            });
            // Defer to next tick so the textarea has the new value before resizing/focusing.
            requestAnimationFrame(() => {
              adjustHeight();
              const el = inputRef.current;
              if (el) {
                el.focus();
                const end = el.value.length;
                try { el.setSelectionRange(end, end); } catch { /* noop */ }
              }
            });
          }
        } catch (err) {
          console.error("transcribe error", err);
          setIsTranscribing(false);
        }
      };
      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error("mic permission error", err);
      alert("No pudimos acceder al micrófono. Revisa los permisos.");
    }
  }, [isRecording, isTranscribing, isLoading, voiceEnabled, sendText]);



  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [input, isLoading]);

  // Global keyboard shortcuts (personalizables desde Ajustes, persistidos en localStorage)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Si estamos capturando un nuevo atajo, no disparar acciones
      if (capturingAction) return;
      if (matchShortcut(e, shortcuts.toggleOpen)) {
        e.preventDefault();
        setHidden(false);
        setOpen(o => !o);
        return;
      }
      if (matchShortcut(e, shortcuts.toggleVoice)) {
        e.preventDefault();
        setVoiceEnabled(v => !v);
        return;
      }
      if (matchShortcut(e, shortcuts.toggleGhost)) {
        e.preventDefault();
        setGhostMode(g => !g);
        setLastGhostAction({ trigger: "shortcut", at: Date.now() });
        return;
      }

    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts, capturingAction]);

  // Captura de un nuevo atajo (con validación de duplicados y reservados)
  useEffect(() => {
    if (!capturingAction) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") { setCapturingAction(null); setShortcutError(null); return; }
      // Ignorar pulsaciones de solo modificadores
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
      const next: Shortcut = {
        ctrl: e.ctrlKey || e.metaKey,
        shift: e.shiftKey,
        alt: e.altKey,
        key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
      };
      const err = validateShortcut(capturingAction, next, shortcuts);
      if (err) {
        setShortcutError({ action: capturingAction, message: err });
        return; // keep capturing so the user can try again
      }
      setShortcutError(null);
      setShortcuts(prev => ({ ...prev, [capturingAction]: next }));
      setCapturingAction(null);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
  }, [capturingAction, shortcuts]);



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Keyboard shortcut: End (or Ctrl/Cmd+↓) jumps to the latest message when
  // the "new messages" pill is visible. Active while the chat is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const hasPill = !atBottom && unreadCount > 0;
      if (!hasPill) return;
      const isEnd = e.key === "End";
      const isCtrlDown = (e.ctrlKey || e.metaKey) && e.key === "ArrowDown";
      if (isEnd || isCtrlDown) {
        e.preventDefault();
        jumpToBottom();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, atBottom, unreadCount, jumpToBottom]);

  const anyTyping = messages.some(m => m.isTyping);

  // Only render last N for performance; older context still kept in state for API history
  const visibleMessages = useMemo(
    () =>
      messages.length > MAX_RENDERED_MESSAGES
        ? messages.slice(-MAX_RENDERED_MESSAGES)
        : messages,
    [messages]
  );

  const launcherStyle: React.CSSProperties = dragPos
    ? { left: dragPos.x, top: dragPos.y, right: "auto", bottom: "auto" }
    : {};

  const onLauncherPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    dragStateRef.current.id = e.pointerId;
    dragStateRef.current.moved = false;
    if (dragStateRef.current.longPress) clearTimeout(dragStateRef.current.longPress);
    dragStateRef.current.longPress = setTimeout(() => {
      setIsDragging(true);
      try { btn.setPointerCapture(e.pointerId); } catch {}
      if ("vibrate" in navigator) navigator.vibrate?.(15);
      const rect = btn.getBoundingClientRect();
      setDragPos({ x: rect.left, y: rect.top });
    }, 320);
  };
  const onLauncherPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    dragStateRef.current.moved = true;
    const size = 72;
    const x = Math.min(Math.max(8, e.clientX - size / 2), window.innerWidth - size - 8);
    const y = Math.min(Math.max(8, e.clientY - size / 2), window.innerHeight - size - 8);
    setDragPos({ x, y });
  };
  const onLauncherPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.longPress) {
      clearTimeout(dragStateRef.current.longPress);
      dragStateRef.current.longPress = null;
    }
    if (isDragging && dragPos) {
      const cx = dragPos.x + 36;
      const cy = dragPos.y + 36;
      const right = cx > window.innerWidth / 2;
      const bottom = cy > window.innerHeight / 2;
      const next: Corner = `${bottom ? "b" : "t"}${right ? "r" : "l"}` as Corner;
      setCorner(next);
      setDragPos(null);
      setIsDragging(false);
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
      return;
    }
    if (!dragStateRef.current.moved) {
      setOpen(o => !o);
    }
  };

  return (
    <>
      <button
        onPointerDown={onLauncherPointerDown}
        onPointerMove={onLauncherPointerMove}
        onPointerUp={onLauncherPointerUp}
        onPointerCancel={() => {
          if (dragStateRef.current.longPress) clearTimeout(dragStateRef.current.longPress);
          setIsDragging(false);
          setDragPos(null);
        }}
        style={launcherStyle}
        aria-label={`Abrir chat con Sora (${formatShortcut(shortcuts.toggleOpen)}; mantén presionado para mover)`}
        title={`Sora — ${formatShortcut(shortcuts.toggleOpen)}${ghostMode ? " · Modo fantasma activo" : ""}`}
        className={cn(
          "fixed z-50 h-[72px] w-[72px] rounded-full shadow-2xl overflow-hidden touch-none select-none",
          !isDragging && "transition-all duration-500 animate-glow-pulse hover:scale-110",
          isDragging && "scale-110 ring-4 ring-primary/50 cursor-grabbing",
          !dragPos && cornerClass(corner),
          dim && !isDragging && "opacity-30 hover:opacity-100",
          hidden && !isDragging && !open && "opacity-0 translate-y-2 pointer-events-none",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <video src="/videos/sora.mp4" poster="/images/foto_chat.png" autoPlay loop muted playsInline className="h-full w-full object-cover scale-150 pointer-events-none" />
        {ghostMode && !open && (
          <span
            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#09090b]/85 ring-2 ring-primary/70 shadow-lg"
            aria-hidden="true"
            title="Modo fantasma activo"
          >
            <Ghost className="h-3 w-3 text-primary" />
          </span>
        )}
      </button>

      {/* Círculo visualizador del radio de proximidad — muestra el umbral en tiempo real */}
      {ghostMode && !open && !isDragging && (() => {
        const size = proximityRadius * 2;
        const offset = 48 - proximityRadius;
        const circleStyle: React.CSSProperties = { width: size, height: size };
        if (corner.endsWith("r")) circleStyle.right = offset; else circleStyle.left = offset;
        if (corner.startsWith("b")) circleStyle.bottom = offset; else circleStyle.top = offset;
        const radiusLabel = `Zona de proximidad de Sora. Radio actual: ${proximityRadius} píxeles. Acerca el cursor a esta área para que reaparezca.`;
        const clampRadius = (n: number) => Math.max(PROXIMITY_MIN, Math.min(PROXIMITY_MAX, Math.round(n)));
        const handleRadiusKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
          let next: number | null = null;
          const bigStep = e.shiftKey ? 1 : 10;
          switch (e.key) {
            case "ArrowUp":
            case "ArrowRight":
              next = proximityRadius + bigStep; break;
            case "ArrowDown":
            case "ArrowLeft":
              next = proximityRadius - bigStep; break;
            case "PageUp":
              next = proximityRadius + 20; break;
            case "PageDown":
              next = proximityRadius - 20; break;
            case "Home":
              next = PROXIMITY_MIN; break;
            case "End":
              next = PROXIMITY_MAX; break;
          }
          if (next !== null) {
            e.preventDefault();
            const clamped = clampRadius(next);
            // Close tooltip so ARIA live announcement isn't visually shadowed by tooltip
            setRadiusTooltipOpen(false);
            if (tooltipAutoCloseRef.current) { clearTimeout(tooltipAutoCloseRef.current); tooltipAutoCloseRef.current = null; }
            if (clamped === proximityRadius) {
              triggerBoundaryHit(clamped === PROXIMITY_MIN ? "min" : "max");
            } else {
              setProximityRadius(clamped);
            }
          }
        };
        const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
          if (e.pointerType === "touch") {
            setRadiusTooltipOpen(true);
            if (tooltipAutoCloseRef.current) clearTimeout(tooltipAutoCloseRef.current);
            tooltipAutoCloseRef.current = setTimeout(() => setRadiusTooltipOpen(false), 2500);
          }
        };
        const boundaryClasses = radiusBoundaryHit
          ? "ring-2 ring-destructive/70 animate-pulse border-destructive/70"
          : "";
        return (
          <TooltipProvider delayDuration={150}>
            <Tooltip open={radiusTooltipOpen} onOpenChange={setRadiusTooltipOpen}>
              <TooltipTrigger asChild>
                <div
                  style={circleStyle}
                  tabIndex={0}
                  role="slider"
                  aria-label="Radio de proximidad de Sora"
                  aria-labelledby="sora-radius-label"
                  aria-valuemin={PROXIMITY_MIN}
                  aria-valuemax={PROXIMITY_MAX}
                  aria-valuenow={proximityRadius}
                  aria-valuetext={`${proximityRadius} píxeles${radiusBoundaryHit === "min" ? " (mínimo alcanzado)" : radiusBoundaryHit === "max" ? " (máximo alcanzado)" : ""}`}
                  aria-describedby="sora-radius-desc"
                  aria-invalid={radiusBoundaryHit !== null || undefined}
                  onKeyDown={handleRadiusKey}
                  onPointerDown={handlePointerDown}
                  className={cn(
                    "fixed z-40 rounded-full border-2 border-dashed border-primary/50 bg-primary/5 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-primary/70 cursor-pointer",
                    radiusPreview || hidden ? "opacity-100 border-primary/70 bg-primary/10 shadow-[0_0_40px_-5px_hsl(var(--primary)/0.5)]" : "opacity-25",
                    boundaryClasses,
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side={corner.startsWith("t") ? "bottom" : "top"} align={corner.endsWith("r") ? "end" : "start"}>
                <div className="max-w-[220px] space-y-1 text-xs">
                  <p className="font-semibold text-primary">Zona de proximidad · {proximityRadius} px</p>
                  <p className="text-muted-foreground">{radiusLabel}</p>
                  <p className="text-[10px] text-muted-foreground/80">Flechas ↑/↓ ajustan ±10 px · Shift = ±1 · Home/End = mín/máx</p>
                </div>
              </TooltipContent>
            </Tooltip>
            <span id="sora-radius-label" className="sr-only">Radio de proximidad de Sora en píxeles</span>
            <span id="sora-radius-desc" className="sr-only">
              Rango de {PROXIMITY_MIN} a {PROXIMITY_MAX} píxeles. Usa las flechas del teclado para ajustar el umbral en el que Sora reaparece.
            </span>
          </TooltipProvider>
        );
      })()}

      {/* Indicador persistente cuando Sora está oculta por modo fantasma:
          muestra dónde reaparecerá al acercar el cursor. */}
      {ghostMode && hidden && !open && !isDragging && (
        <div
          className={cn(
            "fixed z-40 pointer-events-none flex items-center gap-1.5 rounded-full border border-primary/40 bg-[#09090b]/80 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow-lg transition-opacity duration-500",
            cornerClass(corner),
            proximityHint ? "opacity-100" : "opacity-50"
          )}
          aria-hidden="true"
        >
          <Ghost className="h-3 w-3" />
          <span>Sora · acércate</span>
        </div>
      )}

      {/* Anuncio accesible: se lee en voz al cambiar la última acción del modo fantasma */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {ghostAnnouncement}
      </div>
      {/* Anuncio accesible: cambios en tiempo real del radio de proximidad */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {radiusAnnouncement}
      </div>
      {/* Anuncio accesible: al chocar contra los límites del radio */}
      <div className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
        {radiusBoundaryHit === "min" && `Ya alcanzaste el radio mínimo (${PROXIMITY_MIN} píxeles).`}
        {radiusBoundaryHit === "max" && `Ya alcanzaste el radio máximo (${PROXIMITY_MAX} píxeles).`}
      </div>


      <div
        className={cn(
          "fixed z-50 flex w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] flex-col overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 bg-[#09090b]/95 backdrop-blur-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]",
          panelCornerClass(corner),
          "max-h-[min(600px,calc(100vh-2rem))] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
          open ? "translate-y-0 scale-100 opacity-100" : (corner.startsWith("b") ? "translate-y-10" : "-translate-y-10") + " scale-95 opacity-0 pointer-events-none"
        )}
      >
        <div className="relative flex items-center gap-4 overflow-hidden px-6 py-5 border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50" />
          <div className="relative z-10 flex items-center gap-4 w-full">
            <div className="relative">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary/30 shadow-lg shadow-primary/20">
                <video src="/videos/sora.mp4" poster="/images/foto_chat.png" autoPlay loop muted playsInline className="h-full w-full object-cover scale-150" />
              </div>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#09090b] bg-green-500 shadow-sm" />
            </div>
            <div className="flex-1">
              <div className="text-base font-black tracking-tight text-white uppercase">Sora</div>
              <div className="text-[10px] font-bold text-primary uppercase tracking-widest">IA Ejecutiva · Grupo PSI</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setGhostMode(g => { setLastGhostAction({ trigger: g ? "manual-off" : "manual-on", at: Date.now() }); return !g; }); }}
                title={ghostMode ? `Modo fantasma activo — se oculta al leer (${formatShortcut(shortcuts.toggleGhost)})` : `Activar modo fantasma — auto-ocultar (${formatShortcut(shortcuts.toggleGhost)})`}
                aria-label={ghostMode ? "Desactivar modo fantasma" : "Activar modo fantasma"}
                aria-pressed={ghostMode}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                  ghostMode
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {ghostMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                {ghostMode && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-[#09090b] animate-pulse" aria-hidden="true" />
                )}
              </button>
              <button
                onClick={() => setVoiceEnabled(v => !v)}
                title={voiceEnabled ? `Silenciar voz de Sora (${formatShortcut(shortcuts.toggleVoice)})` : `Activar voz de Sora (${formatShortcut(shortcuts.toggleVoice)})`}
                aria-label={voiceEnabled ? "Silenciar voz" : "Activar voz"}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                  voiceEnabled
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setShowSettings(s => !s)}
                title="Ajustes y atajos de teclado"
                aria-label="Abrir ajustes"
                aria-pressed={showSettings}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                  showSettings
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <SettingsIcon className="h-5 w-5" />
              </button>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 hover:bg-green-500/20 hover:text-green-400 transition-all"
                title="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <button
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex-1">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full space-y-3 overflow-y-auto overscroll-contain p-4"
            style={{ maxHeight: 360, contain: "layout paint style", willChange: "scroll-position" }}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-label="Conversación con Sora"
            tabIndex={0}
          >
            {!helpDismissed && (
              <div className="mb-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-4 text-xs text-white/85 shadow-lg shadow-primary/10 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    <HelpCircle className="h-3.5 w-3.5" /> Ayuda rápida
                  </div>
                  <button
                    onClick={() => setHelpDismissed(true)}
                    className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition"
                    aria-label="Ocultar la ayuda rápida"
                  >
                    Entendido ✕
                  </button>
                </div>
                <div className="mt-2.5 space-y-2 leading-relaxed">
                  {ghostMode ? (
                    <p>
                      <span className="font-semibold text-white">Modo fantasma activo:</span> me oculto al leer o hacer scroll. Acerca el cursor <span className="font-semibold text-primary">a ~{proximityRadius} px</span> de la esquina <span className="font-mono uppercase text-primary">{corner}</span> para que reaparezca.
                    </p>
                  ) : (
                    <p>Actívame el <span className="font-semibold text-primary">modo fantasma</span> (👁 arriba) y me esconderé al leer para no estorbar.</p>
                  )}
                  {lastGhostAction && (
                    <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] text-white/80">
                      <Activity className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">Última acción</div>
                        <div className="truncate">
                          {GHOST_TRIGGER_LABEL[lastGhostAction.trigger]}
                          <span className="text-white/40"> · {new Date(lastGhostAction.at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-1 pt-1">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-white/60">Abrir / cerrar chat</span>
                      <kbd className="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white/90">{formatShortcut(shortcuts.toggleOpen)}</kbd>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-white/60">Alternar voz</span>
                      <kbd className="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white/90">{formatShortcut(shortcuts.toggleVoice)}</kbd>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-white/60">Modo fantasma</span>
                      <kbd className="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white/90">{formatShortcut(shortcuts.toggleGhost)}</kbd>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/50 pt-1">Puedes cambiar los atajos y el radio de proximidad desde <SettingsIcon className="inline h-2.5 w-2.5 -mt-0.5" /> Ajustes.</p>
                </div>

              </div>
            )}
            {visibleMessages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in" role="status" aria-label="Sora está escribiendo">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm">
                  <span className="inline-flex gap-1" aria-hidden="true">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#ea580c]" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#ea580c]" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#ea580c]" style={{ animationDelay: "300ms" }} />
                  </span>
                  <span className="text-xs text-muted-foreground italic">Sora está escribiendo…</span>
                </div>
              </div>
            )}
          </div>

          {/* Live region so screen readers announce new arrivals even while scrolled up */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {!atBottom && unreadCount > 0
              ? `${unreadCount} ${unreadCount === 1 ? "mensaje nuevo" : "mensajes nuevos"} de Sora. Presiona Fin para ir al final.`
              : ""}
          </div>

          {!atBottom && unreadCount > 0 && (
            <button
              type="button"
              onClick={jumpToBottom}
              aria-label={`Ir al final del chat. ${unreadCount} ${unreadCount === 1 ? "mensaje nuevo" : "mensajes nuevos"}. Atajo: tecla Fin.`}
              title="Ir al final (Fin)"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-[#ea580c] px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-[#c2410c] active:scale-95 transition-all animate-fade-in focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-card min-h-[32px]"
            >
              <span aria-hidden="true">↓</span>
              <span>
                {unreadCount} {unreadCount === 1 ? "mensaje nuevo" : "mensajes nuevos"}
              </span>
            </button>
          )}

          {showSettings && (
            <div className="absolute inset-0 z-20 bg-[#09090b]/95 backdrop-blur-xl overflow-y-auto animate-fade-in">
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Ajustes</h3>
                  </div>
                  <button
                    onClick={() => { setShowSettings(false); setCapturingAction(null); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition"
                    aria-label="Cerrar ajustes"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                    <Keyboard className="h-3 w-3" /> Atajos de teclado
                  </div>
                  <p className="text-xs text-white/50">
                    Haz clic en <span className="text-white/80 font-semibold">Cambiar</span> y luego presiona la combinación que quieras usar. Esc cancela.
                  </p>

                  {([
                    { key: "toggleOpen" as const, label: "Abrir / cerrar el chat" },
                    { key: "toggleVoice" as const, label: "Activar / silenciar voz de Sora" },
                    { key: "toggleGhost" as const, label: "Activar / desactivar modo fantasma" },
                  ]).map(({ key, label }) => {
                    const capturing = capturingAction === key;
                    const hasError = shortcutError?.action === key;
                    return (
                      <div key={key} className={cn(
                        "flex flex-col gap-2 rounded-xl border px-3 py-2.5 transition-colors",
                        hasError ? "border-red-500/50 bg-red-500/5" : "border-white/10 bg-white/5"
                      )}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm text-white truncate">{label}</div>
                            <div className="mt-1">
                              <kbd className={cn(
                                "inline-block rounded-md border px-2 py-0.5 text-[11px] font-mono",
                                capturing
                                  ? "border-primary/60 bg-primary/15 text-primary animate-pulse"
                                  : "border-white/15 bg-black/30 text-white/80"
                              )}>
                                {capturing ? "Presiona la combinación…" : formatShortcut(shortcuts[key])}
                              </kbd>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setShortcutError(null);
                              setCapturingAction(capturing ? null : key);
                            }}
                            className={cn(
                              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition",
                              capturing
                                ? "bg-white/10 text-white hover:bg-white/20"
                                : "bg-primary/20 text-primary hover:bg-primary/30"
                            )}
                          >
                            {capturing ? "Cancelar" : "Cambiar"}
                          </button>
                        </div>
                        {hasError && (
                          <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-2 text-[11px] text-red-200" role="alert">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-300" />
                            <span className="leading-relaxed">{shortcutError.message}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}


                  <button
                    onClick={() => { setShortcuts(DEFAULT_SHORTCUTS); setCapturingAction(null); setShortcutError(null); }}
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/60 hover:text-white transition"
                  >
                    <RotateCcw className="h-3 w-3" /> Restablecer valores por defecto
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                    <Radar className="h-3 w-3" /> Radio de proximidad (modo fantasma)
                  </div>
                  <p className="text-xs text-white/50">
                    Distancia (en píxeles) desde la esquina donde vive Sora a partir de la cual reaparece cuando tu cursor se acerca.
                  </p>
                  <div className={cn(
                    "rounded-xl border border-white/10 bg-white/5 px-3 py-3 transition",
                    radiusBoundaryHit && "ring-2 ring-destructive/60 border-destructive/40"
                  )}>
                    <div className="flex items-center justify-between text-[11px] text-white/70 mb-2">
                      <span>Radio actual</span>
                      <span className={cn(
                        "font-mono font-bold tabular-nums",
                        radiusBoundaryHit ? "text-destructive" : "text-primary"
                      )}>{proximityRadius} px</span>
                    </div>
                    <Slider
                      value={[proximityRadius]}
                      min={PROXIMITY_MIN}
                      max={PROXIMITY_MAX}
                      step={10}
                      onValueChange={(vals) => {
                        const v = vals[0] ?? PROXIMITY_DEFAULT;
                        if (v === proximityRadius && (v === PROXIMITY_MIN || v === PROXIMITY_MAX)) {
                          triggerBoundaryHit(v === PROXIMITY_MIN ? "min" : "max");
                        } else {
                          setProximityRadius(v);
                        }
                      }}
                      aria-label="Radio de proximidad en píxeles"
                      aria-invalid={radiusBoundaryHit !== null || undefined}
                    />
                    {radiusBoundaryHit && (
                      <p className="mt-1.5 text-[10px] font-semibold text-destructive" role="alert">
                        {radiusBoundaryHit === "min"
                          ? `Radio mínimo alcanzado (${PROXIMITY_MIN} px).`
                          : `Radio máximo alcanzado (${PROXIMITY_MAX} px).`}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-white/40 font-mono">
                      <span>{PROXIMITY_MIN}px · discreto</span>
                      <span>{PROXIMITY_MAX}px · sensible</span>
                    </div>
                    <button
                      onClick={async () => {
                        setProximityRadius(PROXIMITY_DEFAULT);
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          await supabase
                            .from("profiles")
                            .update({ sora_proximity_radius: null } as never)
                            .eq("user_id", user.id);
                        }
                      }}
                      disabled={proximityRadius === PROXIMITY_DEFAULT}
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/60 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-white/60"
                      aria-label={`Restablecer radio a ${PROXIMITY_DEFAULT} píxeles`}
                    >
                      <RotateCcw className="h-3 w-3" /> Restablecer a {PROXIMITY_DEFAULT} px
                    </button>
                  </div>
                </div>


                {!helpDismissed && (
                  <button
                    onClick={() => setHelpDismissed(false)}
                    className="w-full text-left rounded-xl border border-primary/30 bg-primary/10 p-3 text-[11px] text-white/70 hover:bg-primary/15 transition"
                  >
                    ✅ La tarjeta de <span className="font-semibold text-primary">Ayuda rápida</span> aparece dentro del chat.
                  </button>
                )}
                {helpDismissed && (
                  <button
                    onClick={() => setHelpDismissed(false)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-[11px] font-semibold text-white/70 hover:bg-white/10 transition"
                  >
                    <HelpCircle className="h-3 w-3" /> Volver a mostrar la Ayuda rápida
                  </button>
                )}


                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] text-white/60 leading-relaxed">
                  💡 Tus preferencias se guardan en este navegador y se aplican automáticamente la próxima vez que abras la página.
                </div>
              </div>
            </div>
          )}
        </div>


        <div className="p-5 bg-white/5 border-t border-white/5">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Escuchando…" : isTranscribing ? "Transcribiendo…" : "Escribe o toca el micrófono…"}
              rows={1}
              wrap="soft"
              className="block w-full flex-1 min-w-0 min-h-[56px] max-h-[160px] rounded-2xl border border-white/10 bg-white/5 pl-4 sm:pl-6 pr-24 sm:pr-28 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10 resize-none overflow-y-auto break-words [overflow-wrap:anywhere] [word-break:break-word]"
              disabled={isLoading || isRecording || isTranscribing}
              autoFocus
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isTranscribing}
                title={isRecording ? "Detener grabación" : "Hablar con Sora"}
                aria-label={isRecording ? "Detener grabación" : "Grabar mensaje de voz"}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
                  isRecording
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
              </button>
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                disabled={isLoading || anyTyping || !input.trim() || isRecording || isTranscribing}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
          <div className="mt-3 text-center">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Powered by Grupo PSI Intelligence</span>
          </div>
        </div>
      </div>

      {IS_DEV && showSyncLog && (
        <div
          className="fixed bottom-3 left-3 z-[60] w-[260px] rounded-xl border border-primary/40 bg-black/85 backdrop-blur-md text-white/85 shadow-2xl font-mono text-[10px]"
          role="log"
          aria-label="Log de sincronización (dev)"
        >
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-widest text-[9px]">
              <Activity className="h-3 w-3" /> Sync log · dev
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSyncLog([])}
                className="rounded px-1.5 py-0.5 text-white/50 hover:bg-white/10 hover:text-white text-[9px]"
                title="Limpiar log"
              >
                clear
              </button>
              <button
                onClick={() => setShowSyncLog(false)}
                className="rounded px-1.5 py-0.5 text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Ocultar log"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="max-h-[160px] overflow-y-auto p-2 space-y-0.5">
            {syncLog.length === 0 ? (
              <div className="text-white/40 italic">Sin eventos aún. Abre otra pestaña y cambia un ajuste.</div>
            ) : (
              syncLog.slice().reverse().map(e => (
                <div key={e.id} className="flex items-center gap-2">
                  <span className="text-white/40 tabular-nums">
                    {new Date(e.at).toLocaleTimeString("es-MX", { hour12: false })}
                  </span>
                  <span className={cn(
                    "px-1 rounded text-[9px] uppercase font-bold",
                    e.source === "broadcast" ? "bg-primary/25 text-primary" : "bg-white/10 text-white/70"
                  )}>
                    {e.source === "broadcast" ? "BC" : "LS"}
                  </span>
                  <span className="text-white/90 truncate">{e.type}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {IS_DEV && !showSyncLog && (
        <button
          onClick={() => setShowSyncLog(true)}
          className="fixed bottom-3 left-3 z-[60] rounded-full border border-primary/40 bg-black/80 backdrop-blur px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-primary shadow-lg hover:bg-black/90"
          title="Mostrar log de sincronización"
        >
          <Activity className="inline h-3 w-3 mr-1" /> sync log
        </button>
      )}
    </>

  );
}
