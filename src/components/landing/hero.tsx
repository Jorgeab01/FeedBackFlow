import { ArrowRight, Sparkles, Shield, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export function Hero() {
  const navigate = useNavigate()

  return (
    <section id="hero" className="relative min-h-screen flex flex-col overflow-hidden pt-32 md:pt-44">
      {/* Background - limitado al viewport */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[300px] w-[100vw] max-w-[600px] md:h-[500px] md:max-w-[800px] rounded-full bg-primary/8 blur-[100px] md:blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 flex-1 flex flex-col justify-center">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary px-4 py-1.5 text-sm font-medium">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Nuevo: Estadisticas avanzadas
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-balance text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl"
          >
            Conecta con tus{" "}
            <span className="text-primary">clientes</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base sm:text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            Recibe comentarios valiosos, mejora tu servicio y haz crecer tu negocio con FeedbackFlow.
            Opiniones anonimas, resultados reales.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button size="lg" className="h-12 bg-primary px-6 sm:px-8 text-base text-primary-foreground hover:bg-primary/90 w-full sm:w-auto" onClick={() => navigate('/register')}>
              Empieza Gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-14 flex flex-col items-center gap-4 pb-24 sm:pb-20 sm:flex-row sm:justify-center sm:gap-10"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-accent flex-shrink-0" />
              <span>100% Anonimo</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4 text-accent flex-shrink-0" />
              <span>Sin registro para opinar</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
              <span>Gratis para siempre</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}