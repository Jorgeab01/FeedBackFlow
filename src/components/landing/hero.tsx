import { ArrowRight, Sparkles, Shield, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"

export function Hero() {
  const navigate = useNavigate()
  return (
    <section className="relative overflow-hidden pt-32 pb-0 md:pt-44 md:pb-0">
      {/* Background glow effects - seamless with next section */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/8 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary px-4 py-1.5 text-sm font-medium">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Nuevo: Estadisticas avanzadas con IA
          </Badge>

          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Conecta con tus{" "}
            <span className="text-primary">clientes</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            Recibe comentarios valiosos, mejora tu servicio y haz crecer tu negocio con FeedbackFlow.
            Opiniones anonimas, resultados reales.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90" onClick={() => navigate('/register')}>
              Empieza Gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 border-border px-8 text-base text-foreground hover:bg-secondary">
              Ver Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-14 flex flex-col items-center gap-6 pb-16 md:pb-20 sm:flex-row sm:justify-center sm:gap-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-accent" />
              <span>100% Anonimo</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4 text-accent" />
              <span>Sin registro para opinar</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Gratis para siempre</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
