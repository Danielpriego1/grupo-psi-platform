import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const stories = [
  {
    company: "Cervecería Nacional",
    quote:
      "Grupo Psi nos equipó con extintores certificados en todas nuestras plantas. Su servicio de mantenimiento es impecable.",
    contact: "Ing. Roberto Méndez — Gerente de Seguridad Industrial",
    tag: "Historia de cliente",
  },
  {
    company: "Aceros del Norte",
    quote:
      "Los uniformes industriales que nos proveen son de la mejor calidad. Nuestro equipo está protegido y cómodo.",
    contact: "Lic. María Fernanda Torres — Directora de Operaciones",
    tag: "Historia de cliente",
  },
  {
    company: "Construcciones MX",
    quote:
      "Desde que trabajamos con Grupo Psi, nuestra calificación en auditorías de seguridad mejoró un 40%.",
    contact: "Arq. Carlos Vega — Coordinador de Proyectos",
    tag: "Historia de cliente",
  },
  {
    company: "Plásticos Industriales",
    quote:
      "La recarga y certificación de nuestros extintores se realiza siempre a tiempo. Confiamos plenamente en su equipo.",
    contact: "Ing. Laura Sánchez — Jefa de Planta",
    tag: "Historia de cliente",
  },
];

const patterns = [
  "repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.03) 60px, rgba(255,255,255,0.03) 61px)",
  "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)",
  "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%)",
  "repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(255,255,255,0.02) 80px, rgba(255,255,255,0.02) 81px)",
];

function StoryCard({
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
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    margin: "-45% 0px -45% 0px",
  });

  useEffect(() => {
    if (isInView) {
      setActiveIndex(index);
    }
  }, [isInView, index, setActiveIndex]);

  const isActive = activeIndex === index;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative"
    >
      {/* Gradient glow border */}
      <div
        className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-primary transition-opacity duration-500 blur-[1px]"
        style={{ opacity: isActive ? 0.8 : 0 }}
      />
      <div
        className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-primary transition-opacity duration-500"
        style={{ opacity: isActive ? 1 : 0 }}
      />

      {/* Card */}
      <div
        className={`relative rounded-2xl overflow-hidden transition-all duration-400
          ${isActive ? "shadow-2xl shadow-primary/15 scale-[1.01]" : "shadow-lg scale-100"}`}
      >
        <div className="relative min-h-[340px] sm:min-h-[380px] p-8 sm:p-12 flex flex-col justify-end bg-gradient-to-br from-[hsl(220,25%,7%)] via-[hsl(220,20%,11%)] to-[hsl(220,15%,15%)]">
          {/* Pattern */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: patterns[index % patterns.length] }}
          />

          {/* Tag */}
          <span
            className={`absolute top-6 left-8 sm:top-8 sm:left-12 inline-block rounded-md border px-3 py-1.5 text-xs font-mono font-medium backdrop-blur-sm transition-all duration-300
              ${isActive ? "border-primary/50 bg-white/15 text-white/90" : "border-white/15 bg-white/5 text-white/50"}`}
          >
            {story.tag}
          </span>

          {/* Content */}
          <div className="relative z-10">
            <h3
              className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 transition-colors duration-300
                ${isActive ? "text-white" : "text-white/60"}`}
            >
              {story.company}
            </h3>
            <p
              className={`text-base sm:text-lg leading-relaxed mb-2 max-w-2xl transition-colors duration-300
                ${isActive ? "text-white/85" : "text-white/40"}`}
            >
              {story.quote}
            </p>
            <p
              className={`text-sm mb-5 transition-colors duration-300
                ${isActive ? "text-white/55" : "text-white/25"}`}
            >
              {story.contact}
            </p>

            {/* Arrow */}
            <div className="flex items-center gap-0 text-primary">
              <span
                className="text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-500 ease-out"
                style={{ maxWidth: isActive ? 200 : 0 }}
              >
                Más información&nbsp;
              </span>
              <span
                className="text-lg transition-transform duration-300"
                style={{ transform: isActive ? "translateX(4px)" : "translateX(0)" }}
              >
                →
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CustomerStories() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="inline-block mb-4 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-medium text-primary">
            Casos de Éxito
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Historias de <span className="text-primary">nuestros clientes</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Empresas que confían en Grupo Psi para proteger a su equipo
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-8">
          {stories.map((story, i) => (
            <StoryCard
              key={story.company}
              story={story}
              index={i}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
