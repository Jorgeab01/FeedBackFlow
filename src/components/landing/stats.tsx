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
        <div className="rounded-2xl border border-border/50 bg-card p-8 md:p-12">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
