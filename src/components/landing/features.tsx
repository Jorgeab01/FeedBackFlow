import { Shield, MessageSquare, BarChart3, QrCode, Zap, Globe } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "100% Anonimo",
    description: "Tus clientes opinan sin miedo. El anonimato garantiza comentarios honestos y utiles para tu negocio.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: MessageSquare,
    title: "Comentarios en Tiempo Real",
    description: "Recibe notificaciones instantaneas cada vez que un cliente deje su opinion. No te pierdas nada.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Estadisticas Detalladas",
    description: "Visualiza tendencias, niveles de satisfaccion y metricas clave con graficas intuitivas y faciles de entender.",
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    icon: QrCode,
    title: "Codigo QR Unico",
    description: "Genera un codigo QR para que tus clientes accedan al formulario de feedback de forma rapida y sencilla.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Zap,
    title: "Configuracion en Minutos",
    description: "Crea tu cuenta, personaliza tu formulario y empieza a recibir opiniones en menos de 5 minutos.",
    color: "text-chart-4",
    bg: "bg-chart-4/10",
  },
  {
    icon: Globe,
    title: "Accesible desde Cualquier Lugar",
    description: "Tus clientes pueden opinar desde su movil, tablet u ordenador. Sin necesidad de descargar nada.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-20 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium text-primary">Funciones</span>
          <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Todo lo que necesitas para mejorar tu negocio
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Herramientas potentes y faciles de usar para recopilar, analizar y actuar segun las opiniones de tus clientes.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg}`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
