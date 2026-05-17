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
    <section className="relative py-32 bg-background overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center"
        >
          <span className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Casos de Éxito
          </span>
          <h2 className="mb-4 text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Historias de <span className="text-primary glow-text">nuestros clientes</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Empresas líderes que confían en Grupo PSI para garantizar la seguridad de su capital humano y activos
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
                    "absolute inset-0 text-left rounded-[2.5rem] overflow-hidden border-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]",
                    offset === 0
                      ? "cursor-default border-primary/50"
                      : "cursor-pointer border-white/5"
                  )}
                >
                  <div
                    className="relative h-full flex flex-col justify-end p-10 sm:p-12"
                    style={{
                      background:
                        "linear-gradient(160deg, hsl(220 30% 10%), hsl(220 25% 15%), hsl(225 20% 18%))",
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
                      <div className="mb-6 flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="h-5 w-5 text-primary fill-primary" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <h3 className="mb-4 text-3xl font-black leading-tight text-white sm:text-4xl tracking-tight">
                        {story.company}
                      </h3>
                      <p className="mb-8 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl italic font-medium">
                        "{story.quote}"
                      </p>

                      <div className="inline-flex items-center gap-3 text-primary group/btn">
                        <span className="text-sm font-black uppercase tracking-widest">Leer caso completo</span>
                        <div className="h-8 w-8 rounded-full border border-primary/30 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-white transition-all">
                          <ArrowRight size={16} />
                        </div>
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
