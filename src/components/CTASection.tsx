import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass rounded-2xl p-8 sm:p-12 lg:p-16 text-center max-w-4xl mx-auto border-primary/20"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            ¿Listo para <span className="text-primary glow-text">proteger</span> a tu equipo?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Contáctanos hoy y recibe asesoría personalizada sin costo.
            Cotizamos en menos de 24 horas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="text-base px-8 py-6 glow-primary hover:scale-105 transition-transform"
              asChild
            >
              <a href="https://wa.me/5215512345678" target="_blank" rel="noopener noreferrer">
                <Phone className="h-5 w-5 mr-2" />
                Solicitar cotización
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
              asChild
            >
              <a href="/mantenimiento">
                Servicios de mantenimiento
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
              <span className="text-muted-foreground">+52 55 1234 5678</span>
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
              <span className="text-muted-foreground">Ciudad de México, México</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
