import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"

export function CTA() {
  const navigate = useNavigate()
  return (
    <section className="relative py-20 md:py-32">
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-card">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 h-[300px] w-[400px] rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute bottom-0 left-0 h-[200px] w-[300px] rounded-full bg-accent/5 blur-[80px]" />
          </div>

          <div className="relative px-8 py-16 md:px-16 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
                Empieza a recibir feedback{" "}
                <span className="text-primary">hoy mismo</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
                Unete a miles de negocios que ya mejoran su servicio con las opiniones anonimas de sus clientes.
              </p>

              <div className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  className="h-12 flex-1 border-border/50 bg-card text-foreground placeholder:text-muted-foreground"
                />
                <Button size="lg" className="h-12 bg-primary px-6 text-primary-foreground hover:bg-primary/90" onClick={() => navigate('/register')}>
                  Empezar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Sin tarjeta de credito. Configuracion en menos de 5 minutos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
