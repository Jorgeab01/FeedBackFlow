import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeedbackFlowLogo } from "@/components/landing/logo"
import { useNavigate } from "react-router-dom"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FeedbackFlowLogo className="h-5 w-5" color="#ffffff" />
          </div>
          <span className="text-lg font-bold text-foreground">FeedbackFlow</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Funciones
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Como funciona
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Precios
          </a>
          <a href="#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Testimonios
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/login')}>
            Iniciar Sesion
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate('/register')}>
            Empezar Gratis
          </Button>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-foreground"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 px-6 py-6">
            <a href="#features" onClick={() => setIsOpen(false)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Funciones
            </a>
            <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Como funciona
            </a>
            <a href="#pricing" onClick={() => setIsOpen(false)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Precios
            </a>
            <a href="#testimonials" onClick={() => setIsOpen(false)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Testimonios
            </a>
            <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
              <Button variant="ghost" className="w-full justify-center text-muted-foreground hover:text-foreground" onClick={() => navigate('/login')}>
                Iniciar Sesion
              </Button>
              <Button className="w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate('/register')}>
                Empezar Gratis
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
