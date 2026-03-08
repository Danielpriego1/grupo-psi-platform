import { motion } from "framer-motion";
import { Shield, Award, Users, Clock } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Seguridad Certificada",
    desc: "Todos nuestros productos cumplen con las normas NOM vigentes.",
  },
  {
    icon: Award,
    title: "Calidad Garantizada",
    desc: "Materiales de primera y procesos de fabricación rigurosos.",
  },
  {
    icon: Users,
    title: "Atención Personalizada",
    desc: "Asesoría especializada para cada necesidad industrial.",
  },
  {
    icon: Clock,
    title: "Entrega Puntual",
    desc: "Cumplimos tiempos de entrega en todo México.",
  },
];

export function AboutSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block mb-4 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-medium text-primary">
            Sobre Nosotros
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Más de <span className="text-primary">10 años</span> protegiendo a la industria
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            En Grupo Psi nos dedicamos a proveer soluciones integrales en seguridad industrial,
            desde extintores certificados hasta uniformes de alta calidad para tu equipo de trabajo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass rounded-xl p-6 text-center group hover:border-primary/30 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
