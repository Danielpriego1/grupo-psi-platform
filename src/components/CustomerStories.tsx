import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const stories = [
  {
    company: "Cervecería Nacional",
    quote:
      "Grupo Psi nos equipó con extintores certificados en todas nuestras plantas. Su servicio de mantenimiento es impecable.",
    tag: "Historia de cliente",
    pattern: "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 9px)",
  },
  {
    company: "Aceros del Norte",
    quote:
      "Los uniformes industriales que nos proveen son de la mejor calidad. Nuestro equipo está protegido y cómodo.",
    tag: "Historia de cliente",
    pattern: "radial-gradient(circle at 85% 15%, rgba(255,255,255,0.06) 0%, transparent 55%), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.02) 60px, rgba(255,255,255,0.02) 61px)",
  },
  {
    company: "Construcciones MX",
    quote:
      "Desde que trabajamos con Grupo Psi, nuestra calificación en auditorías de seguridad mejoró un 40%.",
    tag: "Historia de cliente",
    pattern: "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.025) 40px, rgba(255,255,255,0.025) 41px)",
  },
  {
    company: "Plásticos Industriales",
    quote:
      "La recarga y certificación de nuestros extintores se realiza siempre a tiempo. Confiamos plenamente en su equipo.",
    tag: "Historia de cliente",
    pattern: "radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.05) 0%, transparent 50%), repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(255,255,255,0.02) 12px, rgba(255,255,255,0.02) 13px)",
  },
];

export function CustomerStories() {
  const [activeIndex, setActiveIndex] = useState(0);

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

        <div className="mx-auto max-w-4xl">
          {/* Card display */}
          <div className="relative min-h-[380px] sm:min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[1.6rem] p-[1.5px]"
                style={{
                  background: "linear-gradient(135deg, hsl(220 85% 62%), hsl(258 84% 67%), hsl(var(--primary)))",
                  boxShadow: "0 14px 38px hsl(220 85% 60% / 0.24), 0 0 0 1px hsl(258 84% 67% / 0.35)",
                }}
              >
                <div className="overflow-hidden rounded-[1.5rem]">
                  <div
                    className="relative min-h-[340px] sm:min-h-[400px] flex flex-col justify-end p-8 sm:p-10"
                    style={{
                      background: "linear-gradient(160deg, hsl(220 22% 8%), hsl(220 18% 12%), hsl(225 15% 14%))",
                    }}
                  >
                    {/* Pattern overlay */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ backgroundImage: stories[activeIndex].pattern }}
                    />

                    {/* Tag */}
                    <span className="absolute left-6 top-6 sm:left-8 sm:top-8 rounded-md border border-background/15 bg-background/10 px-2.5 py-1 text-[11px] font-mono font-medium text-background/70 backdrop-blur-sm">
                      {stories[activeIndex].tag}
                    </span>

                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="mb-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                        {stories[activeIndex].company}
                      </h3>
                      <p className="mb-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                        "{stories[activeIndex].quote}"
                      </p>

                      <div className="inline-flex items-center gap-2 text-primary">
                        <span className="text-sm font-medium">Más información</span>
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation dots + buttons */}
          <div className="mt-8 flex items-center justify-center gap-3">
            {stories.map((story, i) => (
              <button
                key={story.company}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === activeIndex
                    ? "h-3 w-10 bg-primary shadow-lg shadow-primary/30"
                    : "h-3 w-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Ver historia de ${story.company}`}
              />
            ))}
          </div>

          {/* Company names as tabs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {stories.map((story, i) => (
              <button
                key={story.company}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                  i === activeIndex
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                )}
              >
                {story.company}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
