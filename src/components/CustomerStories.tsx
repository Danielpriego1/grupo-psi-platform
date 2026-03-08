import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
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

function StoryCardStep({
  story,
  index,
  activeIndex,
  setActiveIndex,
}: {
  story: (typeof stories)[0];
  index: number;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
}) {
  const stepRef = useRef<HTMLDivElement>(null);
  const isStepInView = useInView(stepRef, {
    margin: "-35% 0px -40% 0px",
  });

  useEffect(() => {
    if (isStepInView) setActiveIndex(index);
  }, [isStepInView, index, setActiveIndex]);

  const isActive = activeIndex === index;

  return (
    <div
      ref={stepRef}
      className={cn(
        "relative min-h-[78vh]",
        index === 0 ? "" : "-mt-[48vh]"
      )}
    >
      <motion.article
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-24"
        style={{ zIndex: index + 1 }}
      >
        <motion.div
          animate={{
            y: isActive ? 0 : 14,
            scale: isActive ? 1 : 0.985,
            opacity: isActive ? 1 : 0.9,
          }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[1.6rem] p-[1.5px]"
          style={{
            background: isActive
              ? "linear-gradient(135deg, hsl(220 85% 62%), hsl(258 84% 67%), hsl(var(--primary)))"
              : "hsl(var(--border))",
            boxShadow: isActive
              ? "0 14px 38px hsl(220 85% 60% / 0.24), 0 0 0 1px hsl(258 84% 67% / 0.35)"
              : "0 10px 22px hsl(var(--foreground) / 0.12)",
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
                style={{ backgroundImage: story.pattern }}
              />

              {/* Tag */}
              <span className="absolute left-6 top-6 sm:left-8 sm:top-8 rounded-md border border-background/15 bg-background/10 px-2.5 py-1 text-[11px] font-mono font-medium text-background/70 backdrop-blur-sm">
                {story.tag}
              </span>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="mb-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  {story.company}
                </h3>
                <p className="mb-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                  {story.quote}
                </p>

                <div className="inline-flex items-center gap-2 text-primary">
                  <span
                    className="overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-400 ease-out"
                    style={{ maxWidth: isActive ? 160 : 0, opacity: isActive ? 1 : 0 }}
                  >
                    Más información
                  </span>
                  <motion.span
                    animate={{ x: isActive ? 4 : 0 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  >
                    <ArrowRight size={18} />
                  </motion.span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.article>
    </div>
  );
}

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
            Tarjetas apiladas que se activan una por una al hacer scroll
          </p>
        </motion.div>

        <div className="mx-auto max-w-5xl pb-12">
          {stories.map((story, index) => (
            <StoryCardStep
              key={story.company}
              story={story}
              index={index}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
