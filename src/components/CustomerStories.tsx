import { motion } from "framer-motion";

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

const gradients = [
  "from-primary via-orange-400 to-yellow-500",
  "from-blue-500 via-purple-500 to-primary",
  "from-emerald-400 via-cyan-500 to-blue-500",
  "from-primary via-rose-500 to-purple-500",
];

const patterns = [
  "repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.03) 60px, rgba(255,255,255,0.03) 61px)",
  "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)",
  "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%)",
  "repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(255,255,255,0.02) 80px, rgba(255,255,255,0.02) 81px)",
];

function StoryCard({ story, index }: { story: (typeof stories)[0]; index: number }) {
  // Each card sticks a little lower so they peek from behind
  const stickyTop = 80 + index * 20;

  return (
    <div
      className="sticky h-[420px] sm:h-[440px]"
      style={{ top: stickyTop, zIndex: index + 1 }}
    >
      <div className="group cursor-pointer h-full">
        {/* Gradient border glow on hover */}
        <div
          className={`relative h-full p-[2px] rounded-2xl transition-all duration-500
            bg-gradient-to-br ${gradients[index % gradients.length]}
            opacity-40 group-hover:opacity-100
            shadow-lg group-hover:shadow-2xl group-hover:shadow-primary/10`}
        >
          <div className="relative h-full rounded-[14px] overflow-hidden bg-gradient-to-br from-[hsl(220,25%,7%)] via-[hsl(220,20%,11%)] to-[hsl(220,15%,15%)]">
            {/* Pattern */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: patterns[index % patterns.length] }}
            />

            {/* Tag */}
            <span className="absolute top-6 left-8 sm:top-8 sm:left-12 inline-block rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-mono font-medium text-white/70 group-hover:border-primary/40 group-hover:text-white/90 transition-all duration-300">
              {story.tag}
            </span>

            {/* Content pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3">
                {story.company}
              </h3>
              <p className="text-base sm:text-lg text-white/70 leading-relaxed mb-2 max-w-2xl group-hover:text-white/90 transition-colors duration-300">
                {story.quote}
              </p>
              <p className="text-sm text-white/40 mb-4 group-hover:text-white/60 transition-colors duration-300">
                {story.contact}
              </p>

              {/* Arrow with text reveal on hover */}
              <div className="flex items-center gap-0 text-primary">
                <span className="text-sm font-medium max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-[200px] transition-all duration-500 ease-out">
                  Más información&nbsp;
                </span>
                <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
            Historias de <span className="text-primary">nuestros clientes</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Empresas que confían en Grupo Psi para proteger a su equipo
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {stories.map((story, i) => (
            <StoryCard key={story.company} story={story} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
