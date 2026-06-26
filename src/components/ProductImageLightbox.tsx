import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  index: number;
  open: boolean;
  alt: string;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export function ProductImageLightbox({ images, index, open, alt, onClose, onIndexChange }: Props) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Reset zoom on image change / close
  useEffect(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, [index, open]);

  // Mover foco al abrir y restaurarlo al cerrar
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
    // Esperar al render para enfocar
    const id = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Scroll miniatura activa a la vista
  useEffect(() => {
    if (!open) return;
    const el = thumbsRef.current?.querySelector<HTMLElement>(`[data-thumb-index="${index}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index, open]);

  // Keyboard nav + trap de foco
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Home") onIndexChange(0);
      else if (e.key === "End") onIndexChange(images.length - 1);
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, z + 0.5));
      else if (e.key === "-") setZoom((z) => Math.max(1, z - 0.5));
      else if (e.key === "0") { setZoom(1); setOffset({ x: 0, y: 0 }); }
      else if (e.key === "Tab") {
        // Trap focus dentro del contenedor
        const root = containerRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, images.length]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const next = () => onIndexChange((index + 1) % images.length);
  const prev = () => onIndexChange((index - 1 + images.length) % images.length);

  const toggleZoom = () => {
    if (zoom > 1) { setZoom(1); setOffset({ x: 0, y: 0 }); }
    else setZoom(2.5);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) { await el.requestFullscreen(); setIsFullscreen(true); }
      else { await document.exitFullscreen(); setIsFullscreen(false); }
    } catch { /* ignore */ }
  };

  // Touch handlers — swipe to change image when not zoomed, pan when zoomed
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    if (zoom > 1) dragStart.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (zoom > 1 && dragStart.current) {
      const t = e.touches[0];
      setOffset({ x: dragStart.current.ox + (t.clientX - dragStart.current.x), y: dragStart.current.oy + (t.clientY - dragStart.current.y) });
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (zoom > 1) { dragStart.current = null; return; }
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.t;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && dt < 600) {
      if (dx < 0) next(); else prev();
    }
    touchStart.current = null;
  };

  // Wheel zoom (desktop)
  const onWheel = (e: React.WheelEvent) => {
    if (!open) return;
    e.preventDefault();
    setZoom((z) => Math.max(1, Math.min(4, z - e.deltaY * 0.005)));
  };

  // Mouse drag when zoomed
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current || zoom <= 1) return;
    setOffset({ x: dragStart.current.ox + (e.clientX - dragStart.current.x), y: dragStart.current.oy + (e.clientY - dragStart.current.y) });
  };
  const onMouseUp = () => { dragStart.current = null; };

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
      onWheel={onWheel}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white text-sm font-bold tracking-wider">
          {index + 1} / {images.length}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Reducir zoom"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={() => setZoom((z) => Math.min(4, z + 0.5))} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Acercar zoom"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={toggleFullscreen} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Pantalla completa">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={onClose} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Prev / next */}
      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 sm:left-6 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Anterior"><ChevronLeft className="h-6 w-6" /></button>
          <button onClick={next} className="absolute right-2 sm:right-6 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Siguiente"><ChevronRight className="h-6 w-6" /></button>
        </>
      )}

      {/* Image */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          src={images[index]}
          alt={alt}
          draggable={false}
          onDoubleClick={toggleZoom}
          onClick={(e) => { if (zoom === 1) e.stopPropagation(); }}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: dragStart.current ? "none" : "transform 0.25s ease-out",
            cursor: zoom > 1 ? "grab" : "zoom-in",
          }}
          className="max-w-[95vw] max-h-[85vh] object-contain bg-white rounded-lg"
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 px-4 py-4 overflow-x-auto bg-gradient-to-t from-black/80 to-transparent">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={cn(
                "h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 bg-white transition-all",
                i === index ? "border-primary scale-110" : "border-white/30 opacity-60 hover:opacity-100"
              )}
            >
              <img src={img} alt="" className="h-full w-full object-contain p-0.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
