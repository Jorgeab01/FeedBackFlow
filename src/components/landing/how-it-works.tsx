import { UserPlus, Share2, BarChart3, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Crea tu Cuenta",
    description: "Registrate gratis en menos de un minuto. Sin tarjeta de credito, sin compromiso.",
  },
  {
    number: "02",
    icon: Share2,
    title: "Comparte tu Enlace",
    description: "Comparte tu enlace unico o codigo QR con tus clientes en tu local, web o redes sociales.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Analiza y Mejora",
    description: "Recibe feedback anonimo, analiza las tendencias y toma decisiones basadas en datos reales.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-medium text-primary">Funcionamiento</span>
          <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Tres pasos simples para empezar
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Configurar FeedbackFlow es tan facil como 1, 2, 3. Empieza a recibir opiniones hoy mismo.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <div className="rounded-xl border border-border/50 bg-card p-8 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="mt-4 block text-xs font-semibold tracking-widest text-primary/60 uppercase">Paso {step.number}</span>
                <h3 className="mt-2 text-xl font-bold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                  <ArrowRight className="h-5 w-5 text-primary/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
