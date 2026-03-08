import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Flame, HardHat, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "500+", label: "Clientes activos" },
  { value: "15K+", label: "Productos entregados" },
  { value: "10+", label: "Años de experiencia" },
  { value: "100%", label: "Certificación NOM" },
];

const categories = [
  { icon: Flame, label: "Extintores", desc: "PQS, CO₂ y unidades móviles" },
  { icon: HardHat, label: "Uniformes", desc: "Overoles, playeras y más" },
  { icon: Shield, label: "Mantenimiento", desc: "Recarga y certificación" },
];

export function HeroSection({ onScrollToProducts }: { onScrollToProducts: () => void }) {
  const [introDone, setIntroDone] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const logoVideoRef = useRef<HTMLVideoElement>(null);

  const handleLogoEnd = () => {
    setIntroDone(true);
    // After the epic text fades in, show main content
    setTimeout(() => setShowContent(true), 2800);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Phase 1: Logo animation */}
      <AnimatePresence>
        {!introDone && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            {/* Gradient to cover watermark */}
            <div className="absolute bottom-0 left-0 w-2/3 h-48 bg-gradient-to-t from-black via-black to-transparent z-10" />
            <video
              ref={logoVideoRef}
              autoPlay
              muted
              playsInline
              onEnded={handleLogoEnd}
              onCanPlay={(e) => {
                const v = e.currentTarget;
                v.play().catch(() => {});
              }}
              className="w-full h-full object-contain pt-16"
            >
              <source src="/videos/logo-animation.mov" type="video/mp4" />
            </video>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2: Epic welcome text (shows after logo, before main content) */}
      <AnimatePresence>
        {introDone && !showContent && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center px-4">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-primary text-sm sm:text-base uppercase tracking-[0.4em] font-medium mb-4"
              >
                Protección · Seguridad · Innovación
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, scale: 0.9, letterSpacing: "0.3em" }}
                animate={{ opacity: 1, scale: 1, letterSpacing: "0.08em" }}
                transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                className="text-5xl sm:text-7xl lg:text-8xl font-black text-foreground glow-text"
              >
                BIENVENIDO A
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, scale: 0.9, letterSpacing: "0.3em" }}
                animate={{ opacity: 1, scale: 1, letterSpacing: "0.08em" }}
                transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
                className="text-6xl sm:text-8xl lg:text-9xl font-black text-primary glow-text mt-2"
              >
                GRUPO PSI
              </motion.h1>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="h-[2px] w-48 sm:w-72 mx-auto mt-6 bg-gradient-to-r from-transparent via-primary to-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: Main hero with background video */}
      {introDone && (
        <>
          <div className="absolute inset-0 z-0">
            <img
              src="/images/logo_fondo_negro.png"
              alt="Grupo PSI"
              className="h-full w-full object-cover mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
          </div>

          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="relative z-10 container mx-auto px-4 pt-24 pb-16"
              >
                <div className="max-w-4xl mx-auto text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <span className="inline-block mb-6 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-medium text-primary">
                      Protección Industrial Certificada
                    </span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                    className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6"
                  >
                    Equipamiento que{" "}
                    <span className="text-primary glow-text">protege</span>
                    <br />
                    lo que más importa
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
                  >
                    Extintores certificados, uniformes industriales y servicios de mantenimiento
                    con la confianza de más de 500 empresas en México.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.45 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                  >
                    <Button
                      size="lg"
                      onClick={onScrollToProducts}
                      className="text-base px-8 py-6 glow-primary hover:scale-105 transition-transform"
                    >
                      Ver catálogo completo
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-base px-8 py-6 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
                      asChild
                    >
                      <a href="/mantenimiento">Solicitar mantenimiento</a>
                    </Button>
                  </motion.div>

                  {/* Category cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16"
                  >
                    {categories.map((cat) => (
                      <motion.div
                        key={cat.label}
                        whileHover={{ y: -4, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="glass rounded-xl p-5 cursor-pointer group"
                      >
                        <cat.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold text-foreground mb-1">{cat.label}</h3>
                        <p className="text-sm text-muted-foreground">{cat.desc}</p>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Stats */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
                  >
                    {stats.map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 + i * 0.1 }}
                        className="text-center"
                      >
                        <div className="text-3xl sm:text-4xl font-black text-primary glow-text">
                          {stat.value}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                  <motion.button
                    onClick={onScrollToProducts}
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowDown className="h-6 w-6" />
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </section>
  );
}
