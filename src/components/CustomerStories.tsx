import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const stories = [
  {
    company: "Cervecería Nacional",
    quote:
      "Grupo Psi nos equipó con extintores certificados en todas nuestras plantas. Su servicio de mantenimiento es impecable.",
    tag: "Historia de cliente",
  },
  {
    company: "Aceros del Norte",
    quote:
      "Los uniformes industriales que nos proveen son de la mejor calidad. Nuestro equipo está protegido y cómodo.",
    tag: "Historia de cliente",
  },
  {
    company: "Construcciones MX",
    quote:
      "Desde que trabajamos con Grupo Psi, nuestra calificación en auditorías de seguridad mejoró un 40%.",
    tag: "Historia de cliente",
  },
  {
    company: "Plásticos Industriales",
    quote:
      "La recarga y certificación de nuestros extintores se realiza siempre a tiempo. Confiamos plenamente en su equipo.",
    tag: "Historia de cliente",
  },
];

export function CustomerStories() {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = stories.length;

  const go = (dir: 1 | -1) =>
    setActiveIndex((i) => (i + dir + total) % total);

  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-medium text-primary">
            Casos de Éxito
          </span>
          <h2 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Historias de <span className="text-primary">nuestros clientes</span>
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Empresas que confían en Grupo PSI para su seguridad industrial
          </p>
        </motion.div>

        {/* Stacked cards */}
        <div className="mx-auto max-w-3xl">
          <div className="relative h-[360px] sm:h-[340px]">
            {stories.map((story, i) => {
              const offset = (i - activeIndex + total) % total;
              // Show only the front card + 2 behind it (3 total visible).
              const visible = offset < 3;
              const scale = offset === 0 ? 1 : offset === 1 ? 0.95 : 0.9;
              const translateY = offset * 20;
              const opacity = offset === 0 ? 1 : offset === 1 ? 0.6 : 0.35;
              const zIndex = total - offset;

              return (
                <motion.button
                  key={story.company}
                  type="button"
                  onClick={() => offset !== 0 && setActiveIndex(i)}
                  animate={{
                    scale,
                    y: translateY,
                    opacity: visible ? opacity : 0,
                    pointerEvents: visible ? "auto" : "none",
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ zIndex }}
                  className={cn(
                    "absolute inset-0 text-left rounded-2xl overflow-hidden border-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]",
                    offset === 0
                      ? "cursor-default border-primary"
                      : "cursor-pointer border-white/10"
                  )}
                >
                  <div
                    className="relative h-full flex flex-col justify-end p-8 sm:p-10"
                    style={{
                      background:
                        "linear-gradient(160deg, hsl(220 22% 8%), hsl(220 18% 12%), hsl(225 15% 14%))",
                    }}
                  >
                    {/* Subtle pattern */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-60"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.025) 40px, rgba(255,255,255,0.025) 41px)",
                      }}
                    />

                    <span className="absolute left-6 top-6 sm:left-8 sm:top-8 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-mono font-medium text-white/70 backdrop-blur-sm">
                      {story.tag}
                    </span>

                    <div className="relative z-10">
                      <h3 className="mb-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                        {story.company}
                      </h3>
                      <p className="mb-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                        "{story.quote}"
                      </p>

                      <div className="inline-flex items-center gap-2 text-primary">
                        <span className="text-sm font-medium">Más información</span>
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => go(-1)}
              aria-label="Historia anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              {stories.map((s, i) => (
                <button
                  key={s.company}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === activeIndex
                      ? "h-2.5 w-8 bg-primary"
                      : "h-2.5 w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Ver historia ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => go(1)}
              aria-label="Siguiente historia"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
