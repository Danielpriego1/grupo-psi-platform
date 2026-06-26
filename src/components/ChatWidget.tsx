import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { X, Send, MessageCircle, Lock, Mic, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  }, [voiceEnabled]);

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
          if (transcript) await sendText(transcript);
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

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-[72px] w-[72px] rounded-full shadow-2xl transition-all duration-500 overflow-hidden",
          "animate-glow-pulse hover:scale-110",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <video src="/videos/sora.mp4" poster="/images/foto_chat.png" autoPlay loop muted playsInline className="h-full w-full object-cover scale-150" />
      </button>

      <div
        className={cn(
          "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] flex-col overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 bg-[#09090b]/95 backdrop-blur-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]",
          "max-h-[min(600px,calc(100vh-2rem))] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-10 scale-95 opacity-0 pointer-events-none"
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
                onClick={() => setVoiceEnabled(v => !v)}
                title={voiceEnabled ? "Silenciar voz de Sora" : "Activar voz de Sora"}
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
        </div>

        <div className="p-5 bg-white/5 border-t border-white/5">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              rows={1}
              wrap="soft"
              className="block w-full flex-1 min-w-0 min-h-[56px] max-h-[160px] rounded-2xl border border-white/10 bg-white/5 pl-4 sm:pl-6 pr-14 sm:pr-16 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10 resize-none overflow-y-auto break-words [overflow-wrap:anywhere] [word-break:break-word]"
              disabled={isLoading}
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 bottom-2 h-10 w-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              disabled={isLoading || anyTyping || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-3 text-center">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Powered by Grupo PSI Intelligence</span>
          </div>
        </div>
      </div>
    </>
  );
}
