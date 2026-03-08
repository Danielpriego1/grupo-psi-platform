import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const stories = [
  {
    company: "Cervecería Nacional",
    quote:
      "Grupo Psi nos equipó con extintores certificados en todas nuestras plantas.",
    tag: "Historia de cliente",
    image: "/images/services/extintores-grupo-psi.jpeg",
  },
  {
    company: "Aceros del Norte",
    quote:
      "Su mantenimiento preventivo redujo incidentes y mejoró nuestras auditorías.",
    tag: "Historia de cliente",
    image: "/images/services/compresores-linea.jpeg",
  },
  {
    company: "Construcciones MX",
    quote:
      "Con su programa de seguridad integral, elevamos el estándar en todos nuestros proyectos.",
    tag: "Historia de cliente",
    image: "/images/services/cilindros-rack-1.jpeg",
  },
  {
    company: "Plásticos Industriales",
    quote:
      "Recarga, inspección y certificación a tiempo para toda nuestra operación crítica.",
    tag: "Historia de cliente",
    image: "/images/services/scba-equipo.jpeg",
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
          <div className="overflow-hidden rounded-[1.5rem] bg-foreground text-background">
            <div className="relative h-44 w-full">
              <img
                src={story.image}
                alt={`Caso de éxito de ${story.company}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, hsl(var(--foreground) / 0.9), hsl(var(--foreground) / 0.35))",
                }}
              />
              <span className="absolute left-5 top-5 rounded-md border border-background/20 bg-foreground/70 px-2.5 py-1 text-[11px] font-medium text-background/85">
                {story.tag}
              </span>
            </div>

            <div className="px-6 pb-7 pt-6 sm:px-8">
              <h3 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl">
                {story.company}
              </h3>
              <p className="mb-5 max-w-2xl text-base text-background/80 sm:text-lg">
                {story.quote}
              </p>

              <div className="inline-flex items-center gap-2 text-background/90">
                <span className="text-sm font-medium">Más información</span>
                <motion.span
                  animate={{ x: isActive ? 6 : 0 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <ArrowRight size={18} />
                </motion.span>
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
