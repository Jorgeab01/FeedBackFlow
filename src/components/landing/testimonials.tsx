import { Star } from "lucide-react"
import { motion } from "framer-motion"

const testimonials = [
  {
    name: "Maria Garcia",
    role: "Duena de Restaurante",
    content: "Desde que usamos FeedbackFlow, hemos mejorado nuestro servicio un 40%. Las opiniones anonimas nos ayudan a entender lo que realmente piensan nuestros clientes.",
    rating: 5,
    initials: "MG",
  },
  {
    name: "Carlos Lopez",
    role: "Director de Hotel",
    content: "La facilidad de uso es increible. Nuestros huespedes escanean el QR y en segundos nos dejan su opinion. Ha sido un cambio total para nuestro negocio.",
    rating: 5,
    initials: "CL",
  },
  {
    name: "Ana Martinez",
    role: "Gerente de Clinica",
    content: "Las estadisticas en tiempo real nos permiten actuar rapidamente. Hemos reducido las quejas un 60% en solo tres meses gracias a FeedbackFlow.",
    rating: 5,
    initials: "AM",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-20 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-medium text-primary">Opiniones</span>
          <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Miles de negocios ya confian en FeedbackFlow para mejorar su servicio.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {`"${testimonial.content}"`}
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
