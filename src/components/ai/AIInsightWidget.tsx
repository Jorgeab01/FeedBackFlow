import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Lock,
  RefreshCw,
  MessageCircle,
  Clock,
  ChevronDown,
  MessageSquareOff,
} from 'lucide-react'
import type { AISummary } from '@/types'
import { AIChatPanel } from './AIChatPanel'
import type { UseAIHelperReturn } from './types'

interface AIInsightWidgetProps {
  isPro: boolean
  aiHelper: UseAIHelperReturn
  onUpgradeClick: () => void
}

export function AIInsightWidget({ isPro, aiHelper, onUpgradeClick }: AIInsightWidgetProps) {
  const [expanded, setExpanded] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const { summary, isLoadingSummary, error, fetchSummary } = aiHelper
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false)

  // Auto-expandir cuando hay un resumen disponible (por primera vez)
  useEffect(() => {
    if (summary && !hasAutoExpanded) {
      setExpanded(true)
      setHasAutoExpanded(true)
    }
  }, [summary, hasAutoExpanded])

  if (!isPro) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    AI Insights
                    <Badge variant="secondary">Pro</Badge>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                    Análisis automático de tus comentarios: resumen ejecutivo, problemas críticos, fortalezas y chat contextual.
                  </p>
                </div>
              </div>
              <Button
                onClick={onUpgradeClick}
                className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
              >
                Actualizar a Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mb-8"
      >
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl dark:shadow-gray-900/50 overflow-hidden">
          <CardHeader
            className="cursor-pointer pb-4"
            onClick={() => {
              if (!summary && !isLoadingSummary) {
                fetchSummary().catch(() => { /* Error handled via 'error' state in hook */ })
              }
              setExpanded(prev => !prev)
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    AI Insights
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                      Pro
                    </Badge>
                    {summary?.fromCache && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 font-normal">
                        <Clock className="w-3 h-3" />
                        {summary.isStale ? 'datos anteriores' : 'caché'}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Análisis inteligente de tu feedback con IA
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {summary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      fetchSummary({ showToast: true }).catch(err => {
                        if (err.message.includes('Límite')) {
                          toast.error(err.message)
                        }
                      })
                    }}
                    disabled={isLoadingSummary}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingSummary ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                />
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="pt-0 border-t border-gray-100 dark:border-gray-700">
                  {/* Error state - ONLY show if not a rate limit, and never show retry button */}
                  {error && !isLoadingSummary && !error.includes('Límite') && (
                    <div className="py-8 flex flex-col items-center gap-4 text-center">
                      {error.toLowerCase().includes('suficientes') ? (
                        <>
                          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center ring-1 ring-gray-100 dark:ring-gray-700">
                            <MessageSquareOff className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              Aún recopilando datos
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                              Necesitamos reunir un poco más de feedback en los últimos 30 días para que la Inteligencia Artificial pueda extraer conclusiones precisas.
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</p>
                      )}
                    </div>
                  )}

                  {/* Loading state */}
                  {isLoadingSummary && <LoadingSkeleton />}

                  {/* Empty state — not yet analyzed */}
                  {!summary && !isLoadingSummary && !error && (
                    <div className="py-8 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-violet-500" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          Analiza tu feedback con IA
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                          Genera un resumen ejecutivo, identifica los 3 principales problemas y fortalezas de tu negocio.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          fetchSummary({ showToast: true }).catch(err => {
                            if (err.message.includes('Límite')) {
                              toast.error(err.message)
                            }
                          })
                        }}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analizar ahora
                      </Button>
                    </div>
                  )}

                  {/* Summary content */}
                  {summary && !isLoadingSummary && !error && (
                    <SummaryContent
                      summary={summary}
                      onOpenChat={() => setChatOpen(true)}
                    />
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Chat panel (modal/sheet) */}
      <AIChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        aiHelper={aiHelper}
      />
    </>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="py-6 space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  )
}

function SummaryContent({
  summary,
  onOpenChat,
}: {
  summary: AISummary
  onOpenChat: () => void
}) {
  return (
    <div className="py-6 space-y-6">
      {/* Executive summary */}
      {summary.summary ? (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {summary.summary}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-400 dark:text-gray-500 italic leading-relaxed">
            No se pudo generar el resumen ejecutivo. Pulsa refrescar para intentarlo de nuevo.
          </p>
        </div>
      )}

      {/* Issues + Strengths grid */}
      {(summary.topIssues?.length > 0 || summary.topStrengths?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Issues */}
          {summary.topIssues?.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Principales problemas
                </span>
              </div>
              <ul className="space-y-2">
                {summary.topIssues.slice(0, 5).map((issue, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top Strengths */}
          {summary.topStrengths?.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Principales fortalezas
                </span>
              </div>
              <ul className="space-y-2">
                {summary.topStrengths.slice(0, 5).map((strength, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Open chat CTA */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenChat}
          className="border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Preguntar a la IA
        </Button>
      </div>
    </div>
  )
}
