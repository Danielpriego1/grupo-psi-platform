import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Truck,
  FolderOpen,
  ShieldCheck,
  Bot,
  MonitorPlay,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: CalendarDays,
    title: "Agenda inteligente",
    desc: "Programación de mantenimientos.",
  },
  {
    icon: Truck,
    title: "Recolección programada",
    desc: "Coordinación logística sin llamadas.",
  },
  {
    icon: FolderOpen,
    title: "Expedientes digitales",
    desc: "Historial completo por equipo.",
  },
  {
    icon: ShieldCheck,
    title: "Certificaciones y trazabilidad",
    desc: "Control documental permanente.",
  },
];

const timeline: { title: string; desc: string }[] = [
  { title: "Alta del activo", desc: "Registro digital del equipo" },
  { title: "Agenda inteligente", desc: "Programación automática" },
  { title: "Recolección", desc: "Logística coordinada" },
  { title: "Servicio y certificación", desc: "Mantenimiento + NOM" },
  { title: "Entrega y seguimiento", desc: "Continuidad garantizada" },
];

const extras: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Bot,
    title: "Asistente 24/7",
    desc: "Resuelve dudas y guía cada solicitud.",
  },
  {
    icon: MonitorPlay,
    title: "Videollamadas técnicas",
    desc: "Atención especializada cuando se necesita.",
  },
  {
    icon: Clock,
    title: "Seguimiento continuo",
    desc: "Siempre sabrá dónde está su equipo.",
  },
];

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/**
 * Observa una lista de nodos con UN solo IntersectionObserver.
 * Cada nodo se marca como activo exactamente al entrar en pantalla
 * y se deja de observar (sin re-cálculos ni listeners de scroll).
 */
function useInViewItems(count: number, threshold = 0.6) {
  const nodes = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState<boolean[]>(() =>
    Array.from({ length: count }, () => false),
  );

  const setNode = (index: number) => (el: HTMLElement | null) => {
    nodes.current[index] = el;
  };

  useEffect(() => {
    const els = nodes.current.filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced || typeof IntersectionObserver === "undefined") {
      setActive(Array.from({ length: count }, () => true));
      return;
    }

    let frame = 0;
    const pending = new Set<number>();

    const flush = () => {
      frame = 0;
      setActive((prev) => {
        let changed = false;
        const next = [...prev];
        pending.forEach((i) => {
          if (!next[i]) {
            next[i] = true;
            changed = true;
          }
        });
        pending.clear();
        return changed ? next : prev;
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.nodeIndex);
          if (Number.isNaN(i)) continue;
          pending.add(i);
          observer.unobserve(entry.target);
        }
        // Agrupa los cambios en un solo repintado
        if (pending.size && !frame) frame = requestAnimationFrame(flush);
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );

    els.forEach((el) => observer.observe(el));
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [count, threshold]);

  const reachedIndex = active.lastIndexOf(true);
  return { setNode, active, reachedIndex };
}

export function ContinuidadOperativaSection() {
  const header = useInView<HTMLDivElement>(0.2);
  const benefitsRef = useInView<HTMLDivElement>(0.15);
  const timelineRef = useInView<HTMLDivElement>(0.2);
  const desktopNodes = useInViewItems(timeline.length, 0.6);
  const mobileNodes = useInViewItems(timeline.length, 0.6);
  const desktopProgress =
    desktopNodes.reachedIndex < 0
      ? 0
      : ((desktopNodes.reachedIndex + 1) / timeline.length) * 100;
  const mobileProgress =
    mobileNodes.reachedIndex < 0
      ? 0
      : ((mobileNodes.reachedIndex + 1) / timeline.length) * 100;
  const extrasRef = useInView<HTMLDivElement>(0.15);
  const ctaRef = useInView<HTMLDivElement>(0.3);

  /**
   * Al activar el CTA (click o Enter/Espacio) llevamos al usuario al bloque de
   * continuidad operativa y le damos foco, para que teclado y lectores de
   * pantalla reciban contexto inmediato. Respeta prefers-reduced-motion.
   */
  const handleCtaActivate = (
    event: React.MouseEvent<HTMLAnchorElement> | React.KeyboardEvent<HTMLAnchorElement>,
  ) => {
    if ("key" in event && event.key !== "Enter" && event.key !== " ") return;
    if ("metaKey" in event && (event.metaKey || event.ctrlKey)) return;

    const target = timelineRef.ref.current;
    if (!target) return;

    event.preventDefault();
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
    target.focus({ preventScroll: true });
  };

  return (
    <section
      id="continuidad-operativa"
      className="relative overflow-hidden bg-black py-24 sm:py-32 lg:py-40"
      aria-labelledby="continuidad-titulo"
    >
      {/* Continuación visual de la energía del Hero */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[1px] w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-[1px] w-[60%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div
          ref={header.ref}
          className={`mx-auto max-w-4xl text-center transition-all duration-700 ${
            header.inView
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <span className="vps-chip-primary mb-6 inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Nuevo
          </span>

          <h2
            id="continuidad-titulo"
            className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            No damos mantenimiento a equipos.
            <br />
            <span className="text-primary glow-text">
              Administramos la continuidad operativa de nuestros clientes.
            </span>
          </h2>

          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Con nuestro Servicio Administrativo y Personalizado gestionamos el ciclo de vida
            completo de sus equipos críticos para reducir tiempos muertos, eliminar carga
            administrativa y mantener la trazabilidad completa de cada activo.
          </p>
        </div>

        {/* Transition phrase */}
        <div
          className={`mx-auto mt-16 max-w-3xl text-center transition-all duration-700 delay-200 ${
            header.inView
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <p className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            De equipos aislados a una{" "}
            <span className="text-primary">operación siempre visible</span>.
          </p>
        </div>

        {/* Benefits grid 2x2 */}
        <div
          ref={benefitsRef.ref}
          className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {benefits.map((item, i) => (
            <div
              key={item.title}
              className={`group relative rounded-3xl border border-white/10 bg-white/5 p-8 transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:bg-white/[0.08] hover:shadow-[0_30px_60px_-15px_rgba(255,100,0,0.15)] motion-reduce:!transition-none motion-reduce:hover:transform-none ${
                benefitsRef.inView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{
                transitionDelay: benefitsRef.inView ? `${i * 100}ms` : "0ms",
              }}
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5 transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                <item.icon className="h-8 w-8" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                {item.title}
              </h3>
              <p className="mt-2 text-base font-medium leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <section
          id="servicio-administrativo"
          ref={timelineRef.ref}
          tabIndex={-1}
          className="relative mx-auto mt-28 max-w-6xl scroll-mt-24 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-black"
          aria-labelledby="ciclo-de-vida-titulo"
        >
          <div className="mb-12 text-center">
            <span
              id="ciclo-de-vida-titulo"
              className="text-sm font-semibold uppercase tracking-[0.2em] text-primary"
            >
              Ciclo de vida administrado
            </span>
          </div>

          {/* Desktop horizontal timeline */}
          <div className="hidden md:block" data-timeline-variant="desktop">
            <div className="relative">
              {/* Connecting line */}
              <div
                aria-hidden="true"
                className="timeline-line absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20"
              />
              <div
                aria-hidden="true"
                className="timeline-line-progress absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-primary to-primary/60 shadow-[0_0_20px_rgba(255,100,0,0.5)] transition-[width,opacity] duration-700 ease-out will-change-[width] motion-reduce:!transition-none"
                style={{
                  width: `${desktopProgress}%`,
                  opacity: desktopProgress > 0 ? 1 : 0,
                }}
              />

              <ol
                className="relative grid grid-cols-5 gap-4"
                aria-label="Ciclo de vida del equipo"
              >
                {timeline.map((node, i) => {
                  const on = desktopNodes.active[i];
                  return (
                    <li
                      key={node.title}
                      ref={desktopNodes.setNode(i)}
                      data-node-index={i}
                      data-timeline-node="desktop"
                      className={`flex flex-col items-center text-center transition-[transform,opacity] duration-500 ease-out will-change-[transform,opacity] motion-reduce:!transition-none ${
                        on ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                      }`}
                    >
                      <span className="sr-only">
                        Paso {i + 1} de {timeline.length}: {node.title} — {node.desc}
                      </span>
                      <div
                        aria-hidden="true"
                        className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-black transition-[border-color,box-shadow,transform] duration-500 ease-out motion-reduce:!transition-none ${
                          on
                            ? "scale-100 border-primary glow-primary"
                            : "scale-90 border-white/20"
                        }`}
                      >
                        <span
                          className={`text-lg font-black transition-colors duration-500 ${
                            on ? "text-primary" : "text-white/40"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </div>
                      <h4
                        aria-hidden="true"
                        className="mt-5 text-base font-black text-foreground"
                      >
                        {node.title}
                      </h4>
                      <p aria-hidden="true" className="mt-1 text-sm text-muted-foreground">
                        {node.desc}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Mobile vertical timeline */}
          <div className="md:hidden" data-timeline-variant="mobile">
            <div className="relative">
              <div
                aria-hidden="true"
                className="timeline-line absolute bottom-4 left-[2.25rem] top-4 w-[2px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20"
              />
              <div
                aria-hidden="true"
                className="timeline-line-progress absolute left-[2.25rem] top-4 w-[2px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary to-primary/60 shadow-[0_0_20px_rgba(255,100,0,0.5)] transition-[height,opacity] duration-700 ease-out will-change-[height] motion-reduce:!transition-none"
                style={{
                  height: `calc((100% - 2rem) * ${mobileProgress / 100})`,
                  opacity: mobileProgress > 0 ? 1 : 0,
                }}
              />

              <ol
                className="relative space-y-8 pl-10"
                aria-label="Ciclo de vida del equipo"
              >
                {timeline.map((node, i) => {
                  const on = mobileNodes.active[i];
                  return (
                    <li
                      key={node.title}
                      ref={mobileNodes.setNode(i)}
                      data-node-index={i}
                      data-timeline-node="mobile"
                      className={`relative transition-[transform,opacity] duration-500 ease-out will-change-[transform,opacity] motion-reduce:!transition-none ${
                        on ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                      }`}
                    >
                      <span className="sr-only">
                        Paso {i + 1} de {timeline.length}: {node.title} — {node.desc}
                      </span>
                      <div
                        aria-hidden="true"
                        className={`absolute left-[-2.5rem] top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-black transition-[border-color,box-shadow,transform] duration-500 ease-out motion-reduce:!transition-none ${
                          on
                            ? "scale-100 border-primary glow-primary"
                            : "scale-90 border-white/20"
                        }`}
                      >
                        <span
                          className={`text-sm font-black transition-colors duration-500 ${
                            on ? "text-primary" : "text-white/40"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </div>
                      <h4
                        aria-hidden="true"
                        className="text-base font-black text-foreground"
                      >
                        {node.title}
                      </h4>
                      <p aria-hidden="true" className="mt-1 text-sm text-muted-foreground">
                        {node.desc}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

        </section>


        {/* Bottom 3 cards */}
        <div
          ref={extrasRef.ref}
          className="mx-auto mt-28 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {extras.map((item, i) => (
            <div
              key={item.title}
              className={`group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:bg-white/[0.06] motion-reduce:!transition-none motion-reduce:hover:transform-none ${
                extrasRef.inView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{
                transitionDelay: extrasRef.inView ? `${i * 120}ms` : "0ms",
              }}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                <item.icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <h4 className="text-lg font-black text-foreground">
                {item.title}
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          ref={ctaRef.ref}
          className={`mt-20 flex flex-col items-center justify-center gap-4 text-center transition-all duration-700 ${
            ctaRef.inView
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <Button
            asChild
            size="lg"
            className="glow-primary bg-[hsl(var(--cta-strong))] px-8 py-6 text-base font-black uppercase tracking-widest text-white transition-all duration-300 hover:scale-105 hover:bg-[hsl(var(--cta-strong-hover))] motion-reduce:!transition-none motion-reduce:hover:scale-100"
          >
            <a
              href="#servicio-administrativo"
              onClick={handleCtaActivate}
              onKeyDown={handleCtaActivate}
            >
              Conozca nuestro Servicio Administrativo y Personalizado
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">
            Gestión integral del ciclo de vida de sus equipos críticos.
          </p>
        </div>
      </div>
    </section>
  );
}
