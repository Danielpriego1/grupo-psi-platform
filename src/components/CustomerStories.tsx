import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

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

function StoryCard({
  story,
  index,
}: {
  story: (typeof stories)[0];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "center center"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [120, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 1, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  // Alternate gradient border colors
  const gradients = [
    "from-primary via-orange-400 to-yellow-500",
    "from-blue-500 via-purple-500 to-primary",
    "from-emerald-400 via-cyan-500 to-blue-500",
    "from-primary via-rose-500 to-purple-500",
  ];

  return (
    <motion.div
      ref={cardRef}
      style={{ y, opacity, scale }}
      className="sticky"
      // Each card stacks with a slight offset
    >
      {/* Gradient border wrapper */}
      <div
        className={`p-[1px] rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} shadow-2xl`}
      >
        <div className="rounded-2xl bg-card/95 backdrop-blur-xl overflow-hidden">
          {/* Dark textured background */}
          <div className="relative min-h-[320px] sm:min-h-[380px] p-8 sm:p-12 flex flex-col justify-end bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,12%)] to-[hsl(220,15%,16%)]">
            {/* Subtle pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)",
              }}
            />

            {/* Tag */}
            <span className="absolute top-6 left-8 sm:top-8 sm:left-12 inline-block rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white/80">
              {story.tag}
            </span>

            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                {story.company}
              </h3>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-4 max-w-2xl">
                "{story.quote}"
              </p>
              <p className="text-sm text-white/50 mb-4">{story.contact}</p>
              <span className="inline-flex items-center gap-2 text-primary text-sm font-medium group cursor-pointer">
                Más información
                <motion.span
                  className="inline-block"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  →
                </motion.span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CustomerStories() {
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
            Historias de{" "}
            <span className="text-primary">nuestros clientes</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Empresas que confían en Grupo Psi para proteger a su equipo
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          {stories.map((story, i) => (
            <StoryCard key={story.company} story={story} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
