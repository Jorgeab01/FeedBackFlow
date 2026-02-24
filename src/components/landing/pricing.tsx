import { Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const plans = [
  {
    name: "Gratis",
    monthlyPrice: "0",
    yearlyPrice: "0",
    description: "Para probar",
    features: [
      "QR básico",
      "30 comentarios / mes",
      "1 enlace de feedback",
    ],
    cta: "Empezar gratis",
    popular: false,
  },
  {
    name: "Básico",
    monthlyPrice: "5.99",
    yearlyPrice: "4.79",
    description: "Para negocios pequeños",
    features: [
      "QR personalizado",
      "200 comentarios / mes",
      "Exportar CSV",
    ],
    cta: "Elegir Básico",
    popular: false,
  },
  {
    name: "Pro",
    monthlyPrice: "9.99",
    yearlyPrice: "7.99",
    description: "Análisis completo",
    features: [
      "Todo lo del Básico",
      "Comentarios ilimitados",
      "Estadísticas avanzadas",
      "Exportar Excel/PDF",
      "Soporte prioritario",
    ],
    cta: "Elegir Pro",
    popular: true,
  },
]

export function Pricing() {
  const navigate = useNavigate()
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="relative py-20 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium text-primary">Precios</span>
          <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Planes disponibles
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Elige el plan que mejor se adapte a tu negocio. Sin costes ocultos.
          </p>
        </div>

        {/* Toggle Mensual/Anual */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Mensual
          </span>
          <div className="flex items-center gap-2">
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Anual
            </span>
          </div>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
            Ahorra 20%
          </Badge>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-8 transition-all flex flex-col ${plan.popular
                ? "border-primary/50 bg-card shadow-xl shadow-primary/10"
                : "border-border/50 bg-card hover:border-primary/30"
                }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-primary/30 bg-primary text-primary-foreground px-3 py-1">
                  Mas Popular
                </Badge>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-foreground">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}€
                  </span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                {isYearly && plan.name !== "Gratis" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(parseFloat(plan.yearlyPrice) * 12).toFixed(0)}€ facturados anualmente
                  </p>
                )}
                <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="mt-8 flex flex-col gap-3 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate('/register')}
                className={`mt-8 w-full ${plan.popular
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                size="lg"
              >
                {plan.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}