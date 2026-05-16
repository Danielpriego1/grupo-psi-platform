import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  useFpsMonitor,
  useLongTaskMonitor,
  useRenderMetrics,
  useScrollMetrics,
} from "@/lib/perfMonitor";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

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

function renderMarkdown(text: string) {
  // Split on bold + newlines in a single pass to avoid nested spans
  const parts = text.split(/(\*\*.*?\*\*)/);
  const out: React.ReactNode[] = [];
  parts.forEach((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      out.push(<strong key={`b${idx}`}>{part.slice(2, -2)}</strong>);
      return;
    }
    const lines = part.split("\n");
    lines.forEach((line, li) => {
      if (li > 0) out.push(<br key={`br${idx}-${li}`} />);
      if (line) out.push(line);
    });
  });
  return out;
}

const MessageBubble = memo(function MessageBubble({ msg }: { msg: Message }) {
  const content = useMemo(() => renderMarkdown(msg.content), [msg.content]);
  return (
    <div className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          msg.role === "user"
            ? "bg-[#ea580c] text-white rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {content}
        {msg.isTyping && (
          <span className="inline-block w-0.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom" />
        )}
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
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stickToBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessageCountRef = useRef(messages.length);

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
      }
    };
    typingTimeoutRef.current = setTimeout(tick, 18);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    stickToBottomRef.current = true;
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    requestAnimationFrame(() => inputRef.current?.focus());

    try {
      const historyForApi = updatedMessages
        .filter(m => m.id !== "welcome")
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("sora-chat", {
        body: { messages: historyForApi },
      });

      if (error) throw error;

      const reply = data?.reply || "Disculpa, no pude procesar tu solicitud. ¿Podrías intentar de nuevo?";
      const msgId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev,
        { id: msgId, role: "assistant", content: "", isTyping: true },
      ]);
      setIsLoading(false);
      typeMessage(reply, msgId);
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
  };

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
          "fixed bottom-6 right-6 z-50 flex w-[370px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl",
          "max-h-[540px] transition-all duration-400",
          open ? "animate-scale-in opacity-100" : "scale-90 opacity-0 pointer-events-none"
        )}
      >
        <div className="relative flex items-center gap-3 overflow-hidden px-4 py-3">
          <video src="/videos/sora-2.mp4" poster="/images/foto_chat.png" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover brightness-50" />
          <div className="relative z-10 flex items-center gap-3 w-full">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/30">
              <video src="/videos/sora.mp4" poster="/images/foto_chat.png" autoPlay loop muted playsInline className="h-full w-full object-cover scale-150" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Sora · Ejecutiva Grupo PSI</div>
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-bounce-soft" />
                En línea
              </div>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-green-400 transition-colors mr-1"
              title="Escribir por WhatsApp"
              aria-label="Escribir por WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="h-5 w-5" />
            </button>
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

        <div className="border-t border-border p-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre productos, precios..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors duration-200 focus:ring-2 focus:ring-[#ea580c] focus:border-[#ea580c]"
              disabled={isLoading || anyTyping}
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0 rounded-xl bg-[#ea580c] text-white hover:bg-[#c2410c] active:scale-95"
              disabled={isLoading || anyTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
