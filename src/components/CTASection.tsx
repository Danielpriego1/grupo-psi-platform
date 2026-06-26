import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/10 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-[3rem] bg-card/40 backdrop-blur-2xl p-10 sm:p-16 lg:p-20 text-center max-w-5xl mx-auto border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)]"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight">
            ¿Listo para <span className="text-primary glow-text">proteger</span><br />a tu equipo?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Contáctanos hoy y recibe asesoría personalizada sin costo.
            Cotizamos en menos de 24 horas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-2xl mx-auto">
            <Button
              size="storeCta"
              className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all duration-300"
              asChild
            >
              <a href="https://wa.me/5219931684717" target="_blank" rel="noopener noreferrer">
                <Phone />
                <span>Solicitar cotización</span>
              </a>
            </Button>
            <Button
              size="storeCta"
              variant="outline"
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
              asChild
            >
              <a href="/mantenimiento">
                <span>Servicios de mantenimiento</span>
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-2"
            >
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">+52 1 993 168 4717</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-2"
            >
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">ventas@grupopsi.com</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center gap-2"
            >
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Nacajuca, Tabasco, México</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
