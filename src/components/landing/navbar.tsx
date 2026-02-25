import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeedbackFlowLogo } from "@/components/landing/logo"
import { useNavigate, useLocation } from "react-router-dom"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  /** If we're on the landing page, scroll to section. Otherwise navigate to /#section */
  const handleSectionClick = (e: React.MouseEvent, section: string) => {
    e.preventDefault()
    if (location.pathname === "/") {
      // Already on landing — just scroll
      const el = document.getElementById(section)
      if (el) el.scrollIntoView({ behavior: "smooth" })
    } else {
      // Navigate to landing page with hash
      navigate(`/#${section}`)
    }
    setIsOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FeedbackFlowLogo className="h-5 w-5" color="#ffffff" />
          </div>
          <span className="text-lg font-bold text-foreground">FeedbackFlow</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="/#dashboard" onClick={(e) => handleSectionClick(e, "dashboard")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Panel
          </a>
          <a href="/#qr" onClick={(e) => handleSectionClick(e, "qr")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            QR
          </a>
          <a href="/#features" onClick={(e) => handleSectionClick(e, "features")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Características
          </a>
          <a href="/#how-it-works" onClick={(e) => handleSectionClick(e, "how-it-works")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Funcionamiento
          </a>
          <a href="/#testimonials" onClick={(e) => handleSectionClick(e, "testimonials")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Opiniones
          </a>
          <a href="/#pricing" onClick={(e) => handleSectionClick(e, "pricing")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Precios
          </a>
          <a href="/blog" onClick={(e) => { e.preventDefault(); navigate('/blog') }} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Blog
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="outline"
            className="border-muted-foreground text-muted-foreground hover:bg-transparent hover:text-muted-foreground hover:border-muted-foreground"
            onClick={() => navigate('/login')}
          >
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
            <a href="/#dashboard" onClick={(e) => handleSectionClick(e, "dashboard")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Panel
            </a>
            <a href="/#qr" onClick={(e) => handleSectionClick(e, "qr")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              QR
            </a>
            <a href="/#features" onClick={(e) => handleSectionClick(e, "features")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Características
            </a>
            <a href="/#how-it-works" onClick={(e) => handleSectionClick(e, "how-it-works")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Funcionamiento
            </a>
            <a href="/#testimonials" onClick={(e) => handleSectionClick(e, "testimonials")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Opiniones
            </a>
            <a href="/#pricing" onClick={(e) => handleSectionClick(e, "pricing")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Precios
            </a>
            <a href="/blog" onClick={(e) => { e.preventDefault(); setIsOpen(false); navigate('/blog') }} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Blog
            </a>
            <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                className="w-full justify-center border-muted-foreground text-muted-foreground hover:bg-transparent hover:text-muted-foreground hover:border-muted-foreground"
                onClick={() => navigate('/login')}
              >
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