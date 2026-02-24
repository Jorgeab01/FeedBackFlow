import { MessageSquare, TrendingUp, Smile, Star, Users } from "lucide-react"
import { FeedbackFlowLogo } from "@/components/landing/logo"

export function DashboardPreview() {
  return (
    <section className="relative pt-0 pb-16 md:pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[700px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-primary/5">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <FeedbackFlowLogo className="h-4 w-4" color="#ffffff" />
              </div>
              <span className="font-semibold text-foreground">FeedbackFlow</span>
              <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">Plan Gratis</span>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-2 w-24 rounded-full bg-secondary" />
              <span className="text-xs text-muted-foreground">30</span>
              <span className="text-sm text-muted-foreground">demo@email.com</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total Comentarios" value="1,248" icon={<MessageSquare className="h-5 w-5 text-primary" />} />
              <StatCard label="Satisfaccion" value="94%" icon={<TrendingUp className="h-5 w-5 text-accent" />} />
              <StatCard label="Clientes Felices" value="1,173" icon={<Smile className="h-5 w-5 text-accent" />} />
              <StatCard label="Puntuacion" value="4.8" icon={<Star className="h-5 w-5 text-[#f59e0b]" />} extra={<Users className="h-5 w-5 text-primary" />} />
            </div>

            {/* Purple gradient card */}
            <div className="mt-6 overflow-hidden rounded-xl bg-gradient-to-r from-primary/80 to-primary/50 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-primary-foreground">Comparte tu enlace de feedback</h3>
                  <p className="mt-1 text-sm text-primary-foreground/80">
                    Tus clientes pueden dejar comentarios escaneando el codigo QR o visitando el enlace.
                  </p>
                  <div className="mt-4 rounded-lg bg-background/20 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Sparkle />
                      <span className="text-sm text-primary-foreground/90">30 comentarios disponibles este mes</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-background/20">
                      <div className="h-1.5 w-3/4 rounded-full bg-primary-foreground/60" />
                    </div>
                  </div>
                </div>
                <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-primary-foreground lg:flex">
                  <QRPlaceholder />
                </div>
              </div>
            </div>

            {/* Tabs preview */}
            <div className="mt-6 flex items-center gap-4 text-sm">
              <span className="font-medium text-foreground">Todos (1,248)</span>
              <span className="text-muted-foreground">Felices (1,173)</span>
              <span className="text-muted-foreground">Neutros (52)</span>
              <span className="text-muted-foreground">Insatisfechos (23)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value, icon, extra }: { label: string; value: string; icon: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/40 bg-secondary/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {extra}
      </div>
    </div>
  )
}

function Sparkle() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 0L9.6 6.4L16 8L9.6 9.6L8 16L6.4 9.6L0 8L6.4 6.4L8 0Z" fill="currentColor" className="text-primary-foreground/70" />
    </svg>
  )
}

function QRPlaceholder() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="#111327" />
      <rect x="36" y="4" width="16" height="16" rx="2" fill="#111327" />
      <rect x="4" y="36" width="16" height="16" rx="2" fill="#111327" />
      <rect x="8" y="8" width="8" height="8" rx="1" fill="#111327" />
      <rect x="40" y="8" width="8" height="8" rx="1" fill="#111327" />
      <rect x="8" y="40" width="8" height="8" rx="1" fill="#111327" />
      <rect x="24" y="4" width="8" height="4" rx="1" fill="#111327" />
      <rect x="24" y="24" width="8" height="8" rx="1" fill="#111327" />
      <rect x="36" y="36" width="16" height="16" rx="2" stroke="#111327" strokeWidth="2" />
    </svg>
  )
}
