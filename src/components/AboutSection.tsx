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
    <section className="py-32 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10" />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block mb-6 rounded-full border border-primary/30 bg-primary/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Nuestra Trayectoria
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
            Más de <span className="text-primary glow-text">10 años</span><br />protegiendo a la industria
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-xl leading-relaxed">
            En Grupo Psi nos dedicamos a proveer soluciones integrales en seguridad industrial,
            desde extintores certificados hasta uniformes de alta calidad para tu equipo de trabajo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative group rounded-[2.5rem] bg-card/50 backdrop-blur-xl p-10 text-center border border-white/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-3 shadow-2xl shadow-black/10"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-lg shadow-primary/5">
                  <item.icon className="h-10 w-10 transition-transform duration-500 group-hover:scale-110" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-4 tracking-tight">{item.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
