import { MessageSquare, TrendingUp, Smile, Star, Users, BarChart3, LineChart, ChevronDown, Activity } from "lucide-react"
import { FeedbackFlowLogo } from "@/components/landing/logo"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function DashboardPreview() {
  const [showAdvancedStats, setShowAdvancedStats] = useState(true)

  // Datos de ejemplo - evolución de mala a buena
  const stats = {
    total: 1248,
    happyPercentage: 94,
    happy: 1173,
    satisfactionScore: 4.8
  }

  // Datos para gráficos - evolución de mala a buena (últimos 14 días)
  const dailyData = [
    { date: '10 Feb', count: 15, happy: 8, neutral: 4, sad: 3, satisfactionPercentage: 65 },
    { date: '11 Feb', count: 18, happy: 10, neutral: 5, sad: 3, satisfactionPercentage: 68 },
    { date: '12 Feb', count: 22, happy: 14, neutral: 5, sad: 3, satisfactionPercentage: 72 },
    { date: '13 Feb', count: 20, happy: 13, neutral: 4, sad: 3, satisfactionPercentage: 73 },
    { date: '14 Feb', count: 25, happy: 17, neutral: 5, sad: 3, satisfactionPercentage: 76 },
    { date: '15 Feb', count: 28, happy: 20, neutral: 5, sad: 3, satisfactionPercentage: 78 },
    { date: '16 Feb', count: 24, happy: 18, neutral: 4, sad: 2, satisfactionPercentage: 82 },
    { date: '17 Feb', count: 30, happy: 24, neutral: 4, sad: 2, satisfactionPercentage: 85 },
    { date: '18 Feb', count: 35, happy: 29, neutral: 4, sad: 2, satisfactionPercentage: 88 },
    { date: '19 Feb', count: 38, happy: 33, neutral: 3, sad: 2, satisfactionPercentage: 90 },
    { date: '20 Feb', count: 42, happy: 37, neutral: 3, sad: 2, satisfactionPercentage: 91 },
    { date: '21 Feb', count: 45, happy: 41, neutral: 3, sad: 1, satisfactionPercentage: 94 },
    { date: '22 Feb', count: 40, happy: 37, neutral: 2, sad: 1, satisfactionPercentage: 95 },
    { date: '23 Feb', count: 38, happy: 36, neutral: 1, sad: 1, satisfactionPercentage: 96 },
  ]

  const maxDailyCount = Math.max(...dailyData.map(d => d.count))

  // Datos por día de la semana - SOLO AQUÍ LOS COLORES DE SATISFACCIÓN
  const weekdayData = [
    { day: 'Dom', count: 45, satisfactionPercentage: 35 },  // Rojo (0-40%)
    { day: 'Lun', count: 38, satisfactionPercentage: 52 },  // Naranja (40-60%)
    { day: 'Mar', count: 42, satisfactionPercentage: 68 },  // Amarillo (60-80%)
    { day: 'Mié', count: 55, satisfactionPercentage: 74 },  // Amarillo/Verde lima (60-80%)
    { day: 'Jue', count: 68, satisfactionPercentage: 82 },  // Verde (80-100%)
    { day: 'Vie', count: 95, satisfactionPercentage: 89 },  // Verde (80-100%)
    { day: 'Sáb', count: 128, satisfactionPercentage: 94 }, // Verde (80-100%)
  ]

  const maxWeekdayCount = Math.max(...weekdayData.map(d => d.count))

  // Función para obtener color según satisfacción (SOLO para días de la semana)
  const getSatisfactionColorClass = (percentage: number) => {
    if (percentage < 40) return 'bg-red-500'
    if (percentage < 60) return 'bg-orange-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

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
            </div>
          </div>

          {/* Stats grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Total Comentarios"
                value={stats.total.toLocaleString()}
                icon={<MessageSquare className="h-5 w-5 text-primary" />}
                trendUp={true}
              />
              <StatCard
                label="Satisfacción"
                value={`${stats.happyPercentage}%`}
                icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                trendUp={true}
              />
              <StatCard
                label="Clientes Felices"
                value={stats.happy.toLocaleString()}
                icon={<Smile className="h-5 w-5 text-green-500" />}
                trendUp={true}
              />
              <StatCard
                label="Puntuación"
                value={stats.satisfactionScore.toString()}
                icon={<Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                extra={<Users className="h-5 w-5 text-primary" />}
                trendUp={true}
              />
            </div>

            {/* Advanced Stats Section - Pro Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6"
            >
              <div
                className="rounded-xl border border-border/40 bg-secondary/30 overflow-hidden cursor-pointer"
                onClick={() => setShowAdvancedStats(!showAdvancedStats)}
              >
                <div className="flex items-center justify-between p-4 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        Estadísticas Avanzadas
                      </h3>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${showAdvancedStats ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {showAdvancedStats && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-4 space-y-6">
                        {/* KPIs adicionales - Responsive grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-border/40">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground truncate">Tendencia</p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">+47%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground truncate">Media por día</p>
                              <p className="text-lg font-bold text-foreground">31.2</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                              <LineChart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground truncate">Período</p>
                              <p className="text-lg font-bold text-foreground">2 sem</p>
                            </div>
                          </div>
                        </div>

                        {/* Gráficos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Gráfico de barras apiladas */}
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-muted-foreground" />
                              Volumen de comentarios por día
                            </h4>
                            <div className="h-48 flex items-end justify-between gap-1">
                              {dailyData.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                  <div className="relative w-full">
                                    <div
                                      className="w-full bg-secondary rounded-t transition-all duration-300 group-hover:bg-secondary/80 relative overflow-hidden"
                                      style={{ height: `${(day.count / maxDailyCount) * 120}px` }}
                                    >
                                      {/* Barra apilada: Felices */}
                                      <div
                                        className="absolute bottom-0 w-full bg-green-500 transition-all"
                                        style={{ height: `${day.count > 0 ? (day.happy / day.count) * 100 : 0}%` }}
                                      />
                                      {/* Barra apilada: Neutros */}
                                      <div
                                        className="absolute bottom-0 w-full bg-yellow-500 transition-all"
                                        style={{
                                          height: `${day.count > 0 ? (day.neutral / day.count) * 100 : 0}%`,
                                          bottom: `${day.count > 0 ? (day.happy / day.count) * 100 : 0}%`
                                        }}
                                      />
                                      {/* Barra apilada: Insatisfechos */}
                                      <div
                                        className="absolute bottom-0 w-full bg-red-500 transition-all"
                                        style={{
                                          height: `${day.count > 0 ? (day.sad / day.count) * 100 : 0}%`,
                                          bottom: `${day.count > 0 ? ((day.happy + day.neutral) / day.count) * 100 : 0}%`
                                        }}
                                      />
                                    </div>

                                    {/* Tooltip mejorado */}
                                    <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg border border-border min-w-[140px]">
                                      <div className="font-semibold mb-1 border-b border-border pb-1">{day.date}</div>
                                      <div className="space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Total:</span>
                                          <span className="font-medium">{day.count}</span>
                                        </div>
                                        <div className="flex justify-between text-green-600">
                                          <span>😊 Felices:</span>
                                          <span>{day.happy}</span>
                                        </div>
                                        <div className="flex justify-between text-yellow-600">
                                          <span>😐 Neutros:</span>
                                          <span>{day.neutral}</span>
                                        </div>
                                        <div className="flex justify-between text-red-600">
                                          <span>😞 Malas:</span>
                                          <span>{day.sad}</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t border-border mt-1">
                                          <span className="text-muted-foreground">Sat.:</span>
                                          <span className={`font-bold ${day.satisfactionPercentage >= 80 ? 'text-green-600' : day.satisfactionPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {day.satisfactionPercentage}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground rotate-45 origin-left translate-y-2">
                                    {day.date.split(' ')[0]}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-center gap-4 mt-6 text-xs">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-500 rounded-sm" />
                                <span className="text-muted-foreground">Felices</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
                                <span className="text-muted-foreground">Neutros</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                                <span className="text-muted-foreground">Insatisfechos</span>
                              </div>
                            </div>
                          </div>

                          {/* Gráfico de líneas - Satisfacción */}
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                              <LineChart className="w-4 h-4 text-muted-foreground" />
                              Evolución de la satisfacción media
                            </h4>
                            <div className="h-48 relative">
                              <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                                {/* Grid lines */}
                                {[0, 25, 50, 75, 100].map((y, i) => (
                                  <line
                                    key={i}
                                    x1="0"
                                    y1={120 - (y / 100) * 120}
                                    x2="300"
                                    y2={120 - (y / 100) * 120}
                                    stroke="currentColor"
                                    strokeDasharray="4,4"
                                    className="text-border"
                                  />
                                ))}

                                {/* Area fill */}
                                <path
                                  d={`
                                    M 0 ${120 - (dailyData[0]?.satisfactionPercentage || 0) * 1.2}
                                    ${dailyData.map((day, i) => {
                                    const x = (i / (dailyData.length - 1)) * 300
                                    const y = 120 - (day.satisfactionPercentage * 1.2)
                                    return `L ${x} ${y}`
                                  }).join(' ')}
                                    L 300 120 L 0 120 Z
                                  `}
                                  className="fill-green-500/10 dark:fill-green-400/10"
                                />

                                {/* Line */}
                                <path
                                  d={`
                                    M 0 ${120 - (dailyData[0]?.satisfactionPercentage || 0) * 1.2}
                                    ${dailyData.map((day, i) => {
                                    const x = (i / (dailyData.length - 1)) * 300
                                    const y = 120 - (day.satisfactionPercentage * 1.2)
                                    return `L ${x} ${y}`
                                  }).join(' ')}
                                  `}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-green-500 dark:text-green-400"
                                />

                                {/* Points */}
                                {dailyData.map((day, i) => {
                                  const x = (i / (dailyData.length - 1)) * 300
                                  const y = 120 - (day.satisfactionPercentage * 1.2)
                                  return (
                                    <circle
                                      key={i}
                                      cx={x}
                                      cy={y}
                                      r="3"
                                      className="fill-green-500 dark:fill-green-400"
                                    />
                                  )
                                })}
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Distribución por día de la semana - SOLO AQUÍ COLORES DE SATISFACCIÓN */}
                        <div className="pt-4 border-t border-border/40">
                          <h4 className="text-sm font-semibold text-foreground mb-2">
                            Satisfacción media por día de la semana
                          </h4>
                          <div className="grid grid-cols-7 gap-2">
                            {weekdayData.map((day, i) => {
                              const percentage = maxWeekdayCount > 0 ? (day.count / maxWeekdayCount) * 100 : 0
                              const colorClass = getSatisfactionColorClass(day.satisfactionPercentage)
                              return (
                                <div key={i} className="flex flex-col items-center gap-2 group">
                                  <div className="relative w-full h-24 bg-secondary rounded-lg overflow-hidden">
                                    <div
                                      className={`absolute bottom-0 w-full ${colorClass} opacity-90 group-hover:opacity-100 transition-all duration-500`}
                                      style={{ height: `${percentage}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-lg font-bold text-white drop-shadow-md">
                                        {day.count}
                                      </span>
                                    </div>

                                    {/* Tooltip */}
                                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg border border-border">
                                      {day.satisfactionPercentage}% satisfacción
                                    </div>
                                  </div>
                                  <span className="text-xs font-medium text-foreground">{day.day}</span>
                                  <span className={`text-[10px] font-bold ${day.satisfactionPercentage < 40 ? 'text-red-500' :
                                    day.satisfactionPercentage < 60 ? 'text-orange-500' :
                                      day.satisfactionPercentage < 80 ? 'text-yellow-500' : 'text-green-500'
                                    }`}>
                                    {day.satisfactionPercentage}%
                                  </span>
                                </div>
                              )
                            })}
                          </div>

                          {/* Leyenda de colores */}
                          <div className="flex justify-center items-center gap-6 mt-4 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-red-500 rounded-sm" />
                              <span className="text-muted-foreground">0-40%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                              <span className="text-muted-foreground">40-60%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
                              <span className="text-muted-foreground">60-80%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-green-500 rounded-sm" />
                              <span className="text-muted-foreground">80-100%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
  icon,
  extra,
  trend,
  trendUp,
  subtitle
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  extra?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-secondary/50 p-4 hover:bg-secondary/70 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          {trend && (
            <span className={`text-[10px] font-bold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trend}
            </span>
          )}
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {extra}
      </div>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}