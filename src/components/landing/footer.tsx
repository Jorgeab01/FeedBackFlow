import { FeedbackFlowLogo } from "@/components/landing/logo"

const footerLinks = {
  Producto: ["Funciones", "Precios", "Integraciones", "Actualizaciones"],
  Empresa: ["Sobre Nosotros", "Blog", "Empleo", "Contacto"],
  Recursos: ["Documentacion", "Guias", "Soporte", "API"],
  Legal: ["Privacidad", "Terminos", "Cookies", "RGPD"],
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <FeedbackFlowLogo className="h-5 w-5" color="#ffffff" />
              </div>
              <span className="text-lg font-bold text-foreground">FeedbackFlow</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              La forma mas facil y efectiva de recopilar opiniones anonimas de tus clientes para mejorar tu negocio.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground">{category}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            {'2026 FeedbackFlow. Todos los derechos reservados.'}
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Privacidad
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Terminos
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
