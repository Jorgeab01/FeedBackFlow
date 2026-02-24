import { motion } from "framer-motion"

const stats = [
  { value: "10K+", label: "Negocios activos" },
  { value: "2M+", label: "Comentarios recibidos" },
  { value: "96%", label: "Tasa de satisfaccion" },
  { value: "4.9/5", label: "Valoracion media" },
]

export function Stats() {
  return (
    <section className="relative py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border/50 bg-card p-8 md:p-12"
        >
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
