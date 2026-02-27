import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase'
import type { AISummary, ChatMessage } from '@/types'

export interface UseAIHelperReturn {
  summary: AISummary | null
  chatHistory: ChatMessage[]
  isLoadingSummary: boolean
  isLoadingChat: boolean
  error: string | null
  fetchSummary: (options?: { showToast?: boolean, onlyCache?: boolean }) => Promise<void>
  sendMessage: (text: string) => Promise<void>
  clearChat: () => void
  clearError: () => void
}

export function useAIHelper(isPro: boolean): UseAIHelperReturn {
  const [summary, setSummary] = useState<AISummary | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const fetchSummary = useCallback(async (options?: { showToast?: boolean, onlyCache?: boolean }) => {
    if (!isPro) return
    // Silent cache checks don't show a loading skeleton — they run invisibly in the background
    if (!options?.onlyCache) setIsLoadingSummary(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.')

      console.log('AI Helper: Fetching summary...', options)
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          action: 'summary',
          onlyCache: options?.onlyCache || false
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMsg = result.error || (result.details ? `${result.error}: ${result.details}` : 'Error del servidor')
        throw new Error(errorMsg)
      }

      // Si pedimos solo caché y no hay, no hacemos nada más
      if (result.noCache) {
        setSummary(null)
        return
      }

      // Solo mostramos el toast si es una petición manual/explícita
      if (options?.showToast && result.limitReached && result.error) {
        toast.info(result.error)
      }

      // Validate that the summary has actual content before setting it
      const hasSummary = typeof result.summary === 'string' && result.summary.trim().length > 0
      const hasIssues = Array.isArray(result.topIssues) && result.topIssues.length > 0
      const hasStrengths = Array.isArray(result.topStrengths) && result.topStrengths.length > 0

      if (!hasSummary && !hasIssues && !hasStrengths) {
        // Cached data is garbage — treat as if there's no cache
        setSummary(null)
        return
      }

      setSummary(result as AISummary)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      // If there are no comments to analyze, clear any stale summary so the UI is consistent
      if (message.toLowerCase().includes('suficientes')) {
        setSummary(null)
      }
      throw err
    } finally {
      setIsLoadingSummary(false)
    }
  }, [isPro])

  // Cargar resumen automáticamente al montar si es Pro (solo desde caché para no gastar créditos)
  useEffect(() => {
    if (isPro && !hasInitialized) {
      fetchSummary({ onlyCache: true, showToast: false })
        .catch(() => { /* Silent error on mount */ })
      setHasInitialized(true)
    }
  }, [isPro, fetchSummary, hasInitialized])

  const sendMessage = useCallback(async (text: string) => {
    if (!isPro || !text.trim()) return
    setIsLoadingChat(true)
    setError(null)

    const userMessage: ChatMessage = { role: 'user', content: text.trim() }

    // Use functional update to avoid stale closure
    let nextHistory: ChatMessage[] = []
    setChatHistory(prev => {
      nextHistory = [...prev, userMessage]
      return nextHistory
    })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.')

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          action: 'chat',
          messages: nextHistory,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMsg = result.error || (result.details ? `${result.error}: ${result.details}` : 'Error del servidor')
        throw new Error(errorMsg)
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.reply as string,
      }
      setChatHistory(prev => [...prev, assistantMessage])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      if (message.includes('Límite')) {
        // Only set error state — let the caller decide whether to toast
        setError(message)
      } else {
        setError(message)
      }
      // Rollback: remove the optimistic user message
      setChatHistory(prev => prev.slice(0, -1))
    } finally {
      setIsLoadingChat(false)
    }
  }, [isPro])

  const clearChat = useCallback(() => {
    setChatHistory([])
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    summary,
    chatHistory,
    isLoadingSummary,
    isLoadingChat,
    error,
    fetchSummary,
    sendMessage,
    clearChat,
    clearError,
  }
}
